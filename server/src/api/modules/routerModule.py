from pydantic import BaseModel, Field, field_validator
from typing import List

class RouteRequestACO(BaseModel):
    kml_file: str = Field(..., min_length=1)
    height: int = Field(..., ge=1)
    optimizer: str = Field(..., min_length=1)
    start: int = Field(..., ge=0)
    num_ants: int = Field(..., ge=1)
    max_iter: int = Field(..., ge=1)
    alpha: float = Field(..., ge=0)
    beta: float = Field(..., ge=0)
    rho: float = Field(..., ge=0)
    q: int = Field(..., ge=1)
    theta_max: int = Field(...,ge=1)


    @field_validator("kml_file")
    @classmethod
    def validate_kml_file(cls, v: str) -> str:
        if not v.endswith(".kml") and not v.startswith("<?xml"):
            raise ValueError("Файл должен быть в формате .kml или содержать KML-содержимое")
        return v

    @field_validator("optimizer")
    @classmethod
    def validate_optimizer(cls, v: str) -> str:
        valid_optimizers = ["aco", "ga"]
        if v not in valid_optimizers:
            raise ValueError(f"Оптимизатор должен быть одним из: {', '.join(valid_optimizers)}")
        return v

class RouteRequestGA(BaseModel):
    kml_file: str = Field(..., min_length=1)
    height: int = Field(..., ge=1)
    optimizer: str = Field(..., min_length=1)
    start: int = Field(..., ge=0)
    max_iter: int = Field(..., ge=1)
    alpha: float = Field(..., ge=0)
    beta: float = Field(..., ge=0)
    mutation_rate: float = Field(..., ge=0)
    crossover_rate: float = Field(..., ge=0)
    pop_size: int = Field(..., ge=1)
    max_gen: int = Field(..., ge=1)
    theta_max: int = Field(..., ge=1)


    @field_validator("kml_file")
    @classmethod
    def validate_kml_file(cls, v: str) -> str:
        if not v.endswith(".kml") and not v.startswith("<?xml"):
            raise ValueError("Файл должен быть в формате .kml или содержать KML-содержимое")
        return v

    @field_validator("optimizer")
    @classmethod
    def validate_optimizer(cls, v: str) -> str:
        valid_optimizers = ["aco", "ga"]
        if v not in valid_optimizers:
            raise ValueError(f"Оптимизатор должен быть одним из: {', '.join(valid_optimizers)}")
        return v

class Turbine(BaseModel):
    id: int = Field(..., ge=1)
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    z: float = Field(..., ge=0)

class PathPoint(BaseModel):
    id: int = Field(..., ge=1)
    x: float
    y: float
    z: float = Field(..., ge=0)

class TurbinePathResponse(BaseModel):
    turbines: List[Turbine]
    path: List[PathPoint]
    path_length_meters: float = Field(..., ge=0)