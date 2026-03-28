import geopandas as gpd
from sqlalchemy.orm import Session
from api.database.models import WindTurbine, MissionWindTurbines

class GetCoordinatesWindTurbines:
    def __init__(self, filepath=None, height=None, db_session=None, mission_id=None):
        self.filepath = filepath
        self.height = height
        self.db_session = db_session
        self.mission_id = mission_id
        
    def parseCoordinates(self):
        if self.filepath:
            return self._parse_from_kml()
        elif self.db_session and self.mission_id:
            return self._parse_from_db()
        else:
            raise ValueError("Не указан источник данных: filepath или db_session+mission_id")
    
    def _parse_from_kml(self):
        try:
            gdf = gpd.read_file(self.filepath)
            coordinates = []
            for geom in gdf.geometry:
                if geom is not None and geom.geom_type == 'Point':
                    if not (-90 <= geom.y <= 90) or not (-180 <= geom.x <= 180):
                        continue
                    coordinates.append((geom.y, geom.x, self.height))
            if not coordinates:
                raise ValueError("No valid points found in KML file")
            return coordinates
        except FileNotFoundError:
            raise
        except Exception as e:
            raise
    
    def _parse_from_db(self):
        try:
            mission_turbines = self.db_session.query(MissionWindTurbines)\
                .filter(MissionWindTurbines.mission_id == self.mission_id)\
                .order_by(MissionWindTurbines.inspection_order)\
                .all()
            
            if not mission_turbines:
                raise ValueError(f"Не найдены турбины для миссии {self.mission_id}")
            
            coordinates = []
            for mt in mission_turbines:
                turbine = self.db_session.query(WindTurbine)\
                    .filter(WindTurbine.id == mt.object_id)\
                    .first()
                
                if turbine:
                    coordinates.append((
                        float(turbine.latitude), 
                        float(turbine.longitude), 
                        self.height
                    ))
            
            if not coordinates:
                raise ValueError("Не найдены валидные координаты турбин")
                
            return coordinates
            
        except Exception as e:
            raise