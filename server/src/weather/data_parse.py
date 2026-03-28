from datetime import datetime, timedelta
import numpy as np
from scipy.interpolate import interp1d
from weather.weather_api import weather_api

class WeatherDataParser:
    def __init__(self, latitude, longitude, location_name="Unknown", forecast_hours=6):
        self.weather_api = weather_api(latitude, longitude, location_name)
        self.forecast_hours = forecast_hours
        self.weather_data = None

    async def fetch_data(self, session):
        self.weather_data = await self.weather_api.fetch_weather(session)
        if not self.weather_data:
            print(f"Failed to fetch weather data for {self.weather_api.location_name}")
            return False
        return True

    def interpolate_data(self, times, values, target_time):
        try:
            time_nums = [(datetime.fromisoformat(t) - datetime.fromisoformat(times[0])).total_seconds() / 3600 
                         for t in times]
            target_time_num = (target_time - datetime.fromisoformat(times[0])).total_seconds() / 3600
            interpolator = interp1d(time_nums, values, kind='linear', fill_value="extrapolate")
            return float(interpolator(target_time_num))
        except Exception as e:
            print(f"Interpolation error: {e}")
            return None

    def parse_weather_data(self, target_time=None):
        if not self.weather_data:
            return None

        if target_time is None:
            target_time = datetime.now()

        current_weather = self.weather_data.get("current_weather", {})
        hourly_data = self.weather_data.get("hourly", {})

        times = hourly_data.get("time", [])
        if not times:
            print("No time data available")
            return None

        end_time = target_time + timedelta(hours=self.forecast_hours)
        time_indices = [i for i, t in enumerate(times) if datetime.fromisoformat(t) <= end_time]

        parsed_data = {
            "location": {
                "name": self.weather_api.location_name,
                "latitude": self.weather_api.latitude,
                "longitude": self.weather_api.longitude
            },
            "current_weather": {
                "time": current_weather.get("time", target_time.isoformat()),
                "temperature": current_weather.get("temperature", None),
                "wind_speed": current_weather.get("windspeed", None),
                "wind_direction": current_weather.get("winddirection", None),
                "weather_code": current_weather.get("weathercode", None)
            },
            "forecast": []
        }

        for i in time_indices:
            forecast_time = datetime.fromisoformat(times[i])
            if forecast_time < target_time:
                continue

            forecast_entry = {
                "time": times[i],
                "temperature": hourly_data["temperature_2m"][i],
                "precipitation": hourly_data["precipitation"][i],
                "precipitation_probability": hourly_data.get("precipitation_probability", [None] * len(times))[i],
                "wind_speed": {
                    "10m": hourly_data["wind_speed_10m"][i],
                    "80m": hourly_data.get("wind_speed_80m", [None] * len(times))[i],
                    "120m": hourly_data.get("wind_speed_120m", [None] * len(times))[i],
                    "180m": hourly_data.get("wind_speed_180m", [None] * len(times))[i]
                },
                "wind_direction": {
                    "10m": hourly_data["wind_direction_10m"][i],
                    "80m": hourly_data.get("wind_direction_80m", [None] * len(times))[i],
                    "120m": hourly_data.get("wind_direction_120m", [None] * len(times))[i],
                    "180m": hourly_data.get("wind_direction_180m", [None] * len(times))[i]
                },
                "humidity": hourly_data["relativehumidity_2m"][i],
                "pressure": hourly_data["pressure_msl"][i],
                "cloudcover": hourly_data["cloudcover"][i],
                "wind_gusts": hourly_data["wind_gusts_10m"][i]
            }

            if target_time <= forecast_time <= target_time + timedelta(minutes=30):
                for key in ["temperature_2m", "precipitation", "precipitation_probability", 
                           "wind_speed_10m", "wind_speed_80m", "wind_speed_120m", "wind_speed_180m",
                           "wind_direction_10m", "wind_direction_80m", "wind_direction_120m", "wind_direction_180m",
                           "relativehumidity_2m", "pressure_msl", "cloudcover", "wind_gusts_10m"]:
                    value = self.interpolate_data(times, hourly_data.get(key, [None] * len(times)), target_time)
                    if value is not None:
                        if key.startswith("wind_speed_"):
                            forecast_entry["wind_speed"][key.split("_")[-1]] = value
                        elif key.startswith("wind_direction_"):
                            forecast_entry["wind_direction"][key.split("_")[-1]] = value
                        else:
                            forecast_entry[key.split("_")[0]] = value

            parsed_data["forecast"].append(forecast_entry)

        return parsed_data