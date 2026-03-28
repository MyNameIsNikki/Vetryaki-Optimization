from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from aiohttp import ClientSession
from geopy.geocoders import Nominatim

from weather.data_parse import WeatherDataParser

class WeatherService:
    @staticmethod
    async def get_weather_data(location_name: str, forecast_hours: int, session: ClientSession):
        geolocator = Nominatim(user_agent="my_geocoder")
        location = geolocator.geocode(location_name)
        parser = WeatherDataParser(
            latitude=location.latitude,
            longitude=location.longitude,
            location_name=location_name,
            forecast_hours=forecast_hours
        )
        success = await parser.fetch_data(session)
        if not success:
            raise ValueError("Failed to fetch weather data")
        
        weather_json = parser.parse_weather_data()
        return weather_json