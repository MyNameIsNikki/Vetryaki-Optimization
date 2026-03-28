import aiohttp

class weather_api:
    def __init__(self, latitude, longitude, location_name="Unknown"):
        self.latitude = latitude
        self.longitude = longitude
        self.location_name = location_name
        
    def build_url(self):
        return (f"https://api.open-meteo.com/v1/forecast?latitude={self.latitude}&longitude={self.longitude}"
                "&current_weather=true&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m,"
                "wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,"
                "relativehumidity_2m,pressure_msl,cloudcover,wind_gusts_10m&timezone=Europe/Moscow")
        
    async def fetch_weather(self, session):
        url = self.build_url()
        try:
            async with session.get(url, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    print(f"Error for {self.location_name}: HTTP {response.status}")
                    return None
        except aiohttp.ClientError as e:
            print(f"Network error for {self.location_name}: {e}")
            return None