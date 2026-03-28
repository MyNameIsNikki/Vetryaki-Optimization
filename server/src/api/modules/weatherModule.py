from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict
from datetime import datetime

class WeatherRequest(BaseModel):
    location_name: str = Field(..., min_length=1)
    forecast_hours: int = Field(..., ge=1, le=168)

class CurrentWeather(BaseModel):
    time: str
    temperature: float = Field(..., ge=-60, le=60)
    wind_speed: float = Field(..., ge=0)
    wind_direction: int = Field(..., ge=0, le=360)
    weather_code: int = Field(..., ge=0)

    @field_validator("time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("Время должно быть в формате ISO 8601")
        return v

class Forecast(BaseModel):
    time: str
    temperature: float = Field(..., ge=-60, le=60)
    precipitation: Optional[float] = Field(None, ge=0)
    precipitation_probability: Optional[int] = Field(None, ge=0, le=100)
    wind_speed: Dict[str, float] = Field(..., description="Wind speed at different heights")
    wind_direction: Dict[str, float] = Field(..., description="Wind direction at different heights")
    humidity: Optional[float] = Field(None, ge=0, le=100)
    pressure: Optional[float] = Field(None, ge=0)
    cloudcover: Optional[float] = Field(None, ge=0, le=100)
    wind_gusts: Optional[float] = Field(None, ge=0)

    @field_validator("time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("Время должно быть в формате ISO 8601")
        return v
    
    @field_validator("wind_speed", "wind_direction")
    @classmethod
    def validate_wind_heights(cls, v: Dict[str, float]) -> Dict[str, float]:
        valid_heights = {'10m', '80m', '120m', '180m'}
        for height in v.keys():
            if height not in valid_heights:
                raise ValueError(f"Недопустимая высота для ветра: {height}. Допустимые значения: {valid_heights}")
        return v

class Location(BaseModel):
    name: str = Field(..., min_length=1)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class WeatherResponse(BaseModel):
    location: Location
    current_weather: CurrentWeather
    forecast: List[Forecast]