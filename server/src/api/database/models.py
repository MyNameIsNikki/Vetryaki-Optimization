from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Date
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class UAV(Base):
    __tablename__ = "uav"
    
    model_id = Column(String(20), primary_key=True)
    flight_time_min = Column(Integer, nullable=False)
    max_range_km = Column(Float, nullable=False)
    cruise_speed_mps = Column(Float, nullable=False)
    payload_capacity_kg = Column(Float, nullable=False)
    camera_model = Column(String(50), nullable=False)
    fov_deg = Column(Integer, nullable=False)
    resolution = Column(String(20), nullable=False)
    sensor_width_mm = Column(Float, nullable=False)
    sensor_height_mm = Column(Float, nullable=False)
    zoom_type = Column(String(20), nullable=False)

class WindTurbine(Base):
    __tablename__ = "wind_turbine"
    
    id = Column(String(20), primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    hub_height = Column(Float, nullable=False)
    rotor_diameter = Column(Float)
    capacity_kw = Column(Float)
    manufacturer = Column(String(100))
    priority = Column(Integer, nullable=False)
    safe_distance_m = Column(Integer, nullable=False)
    last_inspection_date = Column(Date)
    condition_status = Column(String(20))

class InspectionMissionWind(Base):
    __tablename__ = "inspection_mission_wind"
    
    mission_id = Column(String(20), primary_key=True)
    mission_type = Column(String(50), nullable=False)
    drone_altitude = Column(Float, nullable=False)
    max_duration_min = Column(Integer, nullable=False)
    wind_speed_max = Column(Float, nullable=False)
    precipitation_max = Column(Float, nullable=False)
    temperature_min = Column(Float, nullable=False)
    temperature_max = Column(Float, nullable=False)
    uav_model_id = Column(String(20), ForeignKey("uav.model_id"), nullable=False)
    mission_date = Column(Date)
    status = Column(String(20), default='planned')

class MissionWindTurbines(Base):
    __tablename__ = "mission_wind_turbines"
    
    mission_id = Column(String(20), ForeignKey("inspection_mission_wind.mission_id"), primary_key=True)
    object_id = Column(String(20), ForeignKey("wind_turbine.id"), primary_key=True)
    inspection_order = Column(Integer, nullable=False)
    inspection_frequency_days = Column(Integer)

class OptimizedRoute(Base):
    __tablename__ = "optimized_routes"
    
    route_id = Column(Integer, primary_key=True)
    mission_id = Column(String(20), ForeignKey("inspection_mission_wind.mission_id"), nullable=False)
    optimizer_type = Column(String(10), nullable=False)
    route_path = Column(JSON, nullable=False)
    path_length_meters = Column(Float, nullable=False)
    calculation_time_ms = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())