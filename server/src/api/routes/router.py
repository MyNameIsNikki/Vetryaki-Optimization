from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from aiohttp import ClientSession
import os
import shutil
from uuid import uuid4
from typing import List, Optional
from datetime import datetime

from api.service.weatherService import WeatherService
from api.service.routerService import RouterService
from api.service.detectionService import DetectionService

from api.modules.weatherModule import WeatherRequest, WeatherResponse
from api.modules.routerModule import RouteRequestACO, RouteRequestGA, TurbinePathResponse

from api.database.models import WindTurbine, InspectionMissionWind, MissionWindTurbines, OptimizedRoute
from api.database.databaseconn import get_db

router = APIRouter(prefix="/api", tags=["api"])

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), request_id: str = None):
    if not file.filename.endswith(".kml"):
        raise HTTPException(status_code=400, detail="File must be a .kml file")

    unique_filename = f"{uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    existing_files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith(file.filename)]
    if existing_files:
        existing_file = existing_files[0]
        existing_file_path = os.path.join(UPLOAD_DIR, existing_file)
        return {"file_path": existing_file_path}

    try:
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return {"file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

async def get_http_session():
    async with ClientSession() as session:
        yield session

@router.post("/weather")
async def get_weather(request: WeatherRequest, session: ClientSession = Depends(get_http_session)):
    try:
        weather_data = await WeatherService.get_weather_data(
            location_name=request.location_name,
            forecast_hours=request.forecast_hours,
            session=session
        )
        response = WeatherResponse(**weather_data)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    
@router.post("/dronepath_aco", response_model=TurbinePathResponse)
def get_optimized_path_aco(request: RouteRequestACO):
    try:
        drone_path, path_lengthM = RouterService.get_optimized_path(
            kml_file=request.kml_file,
            height=request.height,
            optimizer=request.optimizer,
            start=request.start,
            num_ants=request.num_ants,
            max_iter=request.max_iter,
            alpha=request.alpha,
            beta=request.beta,
            rho=request.rho,
            q=request.q,
            theta_max=request.theta_max
        )

        response = TurbinePathResponse(
            turbines=drone_path["turbines"],
            path=drone_path["path"],
            path_length_meters=path_lengthM
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/dronepath_ga", response_model=TurbinePathResponse)
def get_optimized_path_ga(request: RouteRequestGA):
    try:
        drone_path, path_lengthM = RouterService.get_optimized_path(
            kml_file=request.kml_file,
            height=request.height,
            optimizer=request.optimizer,
            start=request.start,
            max_iter=request.max_iter,
            alpha=request.alpha,
            beta=request.beta,
            mutation_rate=request.mutation_rate,
            crossover_rate=request.crossover_rate,
            pop_size=request.pop_size,
            max_gen=request.max_gen,
            theta_max=request.theta_max
        )

        response = TurbinePathResponse(
            turbines=drone_path["turbines"],
            path=drone_path["path"],
            path_length_meters=path_lengthM
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/dronepath_from_mission", response_model=TurbinePathResponse)
def get_optimized_path_from_mission(
    mission_id: str,
    height: float,
    optimizer: str,
    start: int = 0,
    num_ants: int = 50,
    max_iter: int = 200,
    alpha: float = 1,
    beta: float = 2,
    rho: float = 0.1,
    q: float = 100,
    theta_max: float = 180,
    pop_size: int = 50,
    max_gen: int = 200,
    mutation_rate: float = 0.1,
    crossover_rate: float = 0.8,
    db: Session = Depends(get_db)
):
    try:
        mission = db.query(InspectionMissionWind).filter(
            InspectionMissionWind.mission_id == mission_id
        ).first()
        
        if not mission:
            raise HTTPException(status_code=404, detail=f"Миссия {mission_id} не найдена")
        
        turbines_count = db.query(MissionWindTurbines).filter(
            MissionWindTurbines.mission_id == mission_id
        ).count()
        
        if turbines_count == 0:
            raise HTTPException(
                status_code=400, 
                detail=f"В миссии {mission_id} нет назначенных турбин"
            )
        
        drone_path, path_length = RouterService.get_optimized_path(
            db_session=db,
            mission_id=mission_id,
            height=height,
            optimizer=optimizer,
            start=start,
            num_ants=num_ants,
            max_iter=max_iter,
            alpha=alpha,
            beta=beta,
            rho=rho,
            q=q,
            theta_max=theta_max,
            pop_size=pop_size,
            max_gen=max_gen,
            mutation_rate=mutation_rate,
            crossover_rate=crossover_rate
        )

        response = TurbinePathResponse(
            turbines=drone_path["turbines"],
            path=drone_path["path"],
            path_length_meters=path_length
        )
        return response
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сервера: {str(e)}")

@router.get("/missions/list")
def get_missions_list(
    db: Session = Depends(get_db)
):
    """Получение списка всех миссий"""
    try:
        from sqlalchemy import text
        
        # Используем сырой SQL для обхода проблем с ORM
        result = db.execute(text("SELECT mission_id, mission_type, drone_altitude, max_duration_min, wind_speed_max, precipitation_max, temperature_min, temperature_max, uav_model_id, mission_date, status FROM inspection_mission_wind ORDER BY mission_date DESC"))
        
        rows = result.fetchall()
        
        missions = []
        for row in rows:
            missions.append({
                "mission_id": row[0],
                "mission_type": row[1],
                "drone_altitude": float(row[2]),
                "max_duration_min": row[3],
                "wind_speed_max": float(row[4]),
                "precipitation_max": float(row[5]),
                "temperature_min": float(row[6]),
                "temperature_max": float(row[7]),
                "uav_model_id": row[8],
                "mission_date": row[9].isoformat() if row[9] else None,
                "status": row[10]
            })
        
        print(f"Found {len(missions)} missions")
        return missions
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")

@router.get("/turbines")
def get_all_turbines(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WindTurbine)
    if status:
        query = query.filter(WindTurbine.condition_status == status)
    
    turbines = query.all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "type": t.type,
            "latitude": float(t.latitude),
            "longitude": float(t.longitude),
            "hub_height": t.hub_height,
            "rotor_diameter": t.rotor_diameter,
            "capacity_kw": t.capacity_kw,
            "manufacturer": t.manufacturer,
            "priority": t.priority,
            "safe_distance_m": t.safe_distance_m,
            "last_inspection_date": t.last_inspection_date.isoformat() if t.last_inspection_date else None,
            "condition_status": t.condition_status
        }
        for t in turbines
    ]

@router.post("/missions")
def create_mission(
    mission_id: str,
    mission_type: str,
    drone_altitude: float,
    max_duration_min: int,
    wind_speed_max: float,
    precipitation_max: float,
    temperature_min: float,
    temperature_max: float,
    uav_model_id: str,
    mission_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        existing = db.query(InspectionMissionWind).filter(
            InspectionMissionWind.mission_id == mission_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail=f"Миссия {mission_id} уже существует")
        
        mission = InspectionMissionWind(
            mission_id=mission_id,
            mission_type=mission_type,
            drone_altitude=drone_altitude,
            max_duration_min=max_duration_min,
            wind_speed_max=wind_speed_max,
            precipitation_max=precipitation_max,
            temperature_min=temperature_min,
            temperature_max=temperature_max,
            uav_model_id=uav_model_id,
            mission_date=datetime.fromisoformat(mission_date) if mission_date else None,
            status="planned"
        )
        
        db.add(mission)
        db.commit()
        
        return {"message": f"Миссия {mission_id} создана", "mission_id": mission_id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания миссии: {str(e)}")

@router.post("/missions/{mission_id}/turbines")
def assign_turbines_to_mission(
    mission_id: str,
    turbine_ids: List[str],
    db: Session = Depends(get_db)
):
    try:
        mission = db.query(InspectionMissionWind).filter(
            InspectionMissionWind.mission_id == mission_id
        ).first()
        
        if not mission:
            raise HTTPException(status_code=404, detail=f"Миссия {mission_id} не найдена")
        
        db.query(MissionWindTurbines).filter(
            MissionWindTurbines.mission_id == mission_id
        ).delete()
        
        for order, turbine_id in enumerate(turbine_ids):
            turbine = db.query(WindTurbine).filter(
                WindTurbine.id == turbine_id
            ).first()
            
            if not turbine:
                raise HTTPException(status_code=404, detail=f"Турбина {turbine_id} не найдена")
            
            mission_turbine = MissionWindTurbines(
                mission_id=mission_id,
                object_id=turbine_id,
                inspection_order=order
            )
            db.add(mission_turbine)
        
        db.commit()
        
        return {
            "message": f"Назначено {len(turbine_ids)} турбин в миссию {mission_id}",
            "mission_id": mission_id,
            "turbines_count": len(turbine_ids)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка назначения турбин: {str(e)}")

@router.get("/missions/{mission_id}/turbines")
def get_mission_turbines(
    mission_id: str,
    db: Session = Depends(get_db)
):
    try:
        mission_turbines = db.query(MissionWindTurbines)\
            .filter(MissionWindTurbines.mission_id == mission_id)\
            .order_by(MissionWindTurbines.inspection_order)\
            .all()
        
        result = []
        for mt in mission_turbines:
            turbine = db.query(WindTurbine).filter(
                WindTurbine.id == mt.object_id
            ).first()
            
            if turbine:
                result.append({
                    "inspection_order": mt.inspection_order,
                    "turbine": {
                        "id": turbine.id,
                        "name": turbine.name,
                        "latitude": float(turbine.latitude),
                        "longitude": float(turbine.longitude),
                        "hub_height": turbine.hub_height,
                        "condition_status": turbine.condition_status
                    }
                })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения турбин: {str(e)}")

@router.get("/missions/{mission_id}/routes")
def get_mission_routes(
    mission_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    routes = db.query(OptimizedRoute)\
        .filter(OptimizedRoute.mission_id == mission_id)\
        .order_by(OptimizedRoute.created_at.desc())\
        .limit(limit)\
        .all()
    
    return [
        {
            "route_id": r.route_id,
            "optimizer_type": r.optimizer_type,
            "path_length_meters": r.path_length_meters,
            "calculation_time_ms": r.calculation_time_ms,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in routes
    ]

@router.post("/detect")
async def detect_defects(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Файл должен быть изображением")
        
        processed_image_base64 = DetectionService.detect_defects(image_data)
        
        return {
            "success": True,
            "processed_image": processed_image_base64,
            "message": "Детекция завершена успешно"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки: {str(e)}")