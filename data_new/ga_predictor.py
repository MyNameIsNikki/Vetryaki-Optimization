import os
import random
import math
from datetime import datetime
import joblib
import json
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd
from typing import List, Dict, Optional
import asyncio


class RouteParameters:
    def __init__(self, waypoints: List[Dict[str, float]], altitude: float, speed: float, priority: str, battery_usage: float):
        self.waypoints = waypoints
        self.altitude = altitude
        self.speed = speed
        self.priority = priority
        self.battery_usage = battery_usage

class GAPredictor:
    def __init__(self, config: Dict):
        # Определяем корень проекта
        self.project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        self.results_dir = os.path.join(self.project_root, config.get("data_paths", {}).get("results_dir", "data_new/prediction_results"))
        os.makedirs(self.results_dir, exist_ok=True)
        
        self.model_length_path = os.path.join(self.project_root, config.get("data_paths", {}).get("model_length_path", "data_new/models/xgboost_model_length.pkl"))
        self.model_battery_path = os.path.join(self.project_root, config.get("data_paths", {}).get("model_battery_path", "data_new/models/xgboost_model_battery.pkl"))
        self.scaler_path = os.path.join(self.project_root, config.get("data_paths", {}).get("scaler_path", "data_new/models/scaler.pkl"))
        
        # Проверка существования файлов
        for path in [self.model_length_path, self.model_battery_path, self.scaler_path]:
            if not os.path.exists(path):
                raise FileNotFoundError(f"Model file {path} not found. Run train_model.py first.")
        
        try:
            self.model_length = joblib.load(self.model_length_path)
            self.model_battery = joblib.load(self.model_battery_path)
            self.scaler = joblib.load(self.scaler_path)
        except Exception as e:
            raise

        ga_params = config.get("optimization_parameters", {}).get("ga_parameters", {})
        self.population_size = ga_params.get("population_size", 50)
        self.mutation_rate = ga_params.get("mutation_rate", 0.1)
        self.crossover_rate = ga_params.get("crossover_rate", 0.8)
        self.max_generations = ga_params.get("max_generations", 100)
        self.target_score = ga_params.get("target_score", 0.9)

        self.min_altitude = ga_params.get("min_altitude", 100)
        self.max_altitude = ga_params.get("max_altitude", 250)
        self.min_speed = config.get("drone_parameters", {}).get("min_speed_mps", 5)
        self.max_speed = config.get("drone_parameters", {}).get("max_speed_mps", 25)
        self.default_altitude = 150

        self.weather_data = None
        self.avoid_areas = []
        self.population = []

    def initialize_population(self, base_route: RouteParameters) -> None:
        """Initialize population with variations of altitude and speed."""
        self.population = [base_route]
        while len(self.population) < self.population_size:
            random_route = RouteParameters(
                waypoints=base_route.waypoints,
                altitude=random.uniform(self.min_altitude, self.max_altitude),
                speed=random.uniform(self.min_speed, self.max_speed),
                priority=base_route.priority,
                battery_usage=base_route.battery_usage
            )
            self.population.append(random_route)

    def fitness_function(self, route: RouteParameters) -> float:
        """Calculate fitness score based on length and battery predictions."""
        feature_vector = self._build_feature_vector(route)
        columns = ['points_count', 'mean_lon', 'mean_lat', 'mean_alt', 'lon_variance', 'lat_variance',
                   'mean_look_alt', 'mean_look_heading', 'mean_look_tilt', 'mean_look_range',
                   'temperature', 'wind_speed', 'wind_direction', 'wind_gust', 'precipitation',
                   'humidity', 'pressure', 'cloud_cover']
        df = pd.DataFrame([feature_vector], columns=columns)
        scaled_features = self.scaler.transform(df)
        
        length_pred = self.model_length.predict(scaled_features)[0]
        battery_pred = self.model_battery.predict(scaled_features)[0]
        
        # Комбинированная оценка пригодности: минимизация длины и затрат батареи
        total_fitness = 1 / (1 + length_pred + battery_pred)
        return total_fitness

    def _build_feature_vector(self, route: RouteParameters) -> List[float]:
        """Build feature vector compatible with train_model.py's features."""
        weather = self.weather_data.get('current_weather', {}) if self.weather_data else {}
        waypoints = route.waypoints
        lons = [wp['lon'] for wp in waypoints]
        lats = [wp['lat'] for wp in waypoints]
        alts = [wp['alt'] for wp in waypoints]

        points_count = len(waypoints)
        mean_lon = np.mean(lons) if lons else 0
        mean_lat = np.mean(lats) if lats else 0
        mean_alt = route.altitude
        lon_variance = np.var(lons) if lons else 0
        lat_variance = np.var(lats) if lats else 0

        mean_look_alt = np.mean(alts) if alts else mean_alt
        mean_look_heading = 0.0
        mean_look_tilt = 0.0
        mean_look_range = 1000.0

        temperature = weather.get('temperature', 0)
        wind_speed = weather.get('wind_speed', 0)
        wind_direction = weather.get('wind_direction', 0)
        wind_gust = self.weather_data.get('forecast', [{}])[0].get('wind_gusts', 0) if self.weather_data else 0
        precipitation = weather.get('precipitation', 0)
        humidity = self.weather_data.get('forecast', [{}])[0].get('humidity', 0) if self.weather_data else 0
        pressure = self.weather_data.get('forecast', [{}])[0].get('pressure', 0) if self.weather_data else 0
        cloud_cover = self.weather_data.get('forecast', [{}])[0].get('cloudcover', 0) if self.weather_data else 0

        feature_vector = [
            points_count, mean_lon, mean_lat, mean_alt, lon_variance, lat_variance,
            mean_look_alt, mean_look_heading, mean_look_tilt, mean_look_range,
            temperature, wind_speed, wind_direction, wind_gust, precipitation,
            humidity, pressure, cloud_cover
        ]
        return feature_vector

    def _calculate_total_distance(self, waypoints: List[Dict]) -> float:
        total = 0.0
        if len(waypoints) < 2:  # Проверка на достаточное количество точек
            return 0.0
        for i in range(len(waypoints) - 1):
            p1, p2 = waypoints[i], waypoints[i + 1]
            total += self._haversine_distance(p1['lat'], p1['lon'], p2['lat'], p2['lon'])
        return total

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371  # Радиус Земли в км
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c * 1000  # Возвращаем в метрах

    def selection(self) -> List[RouteParameters]:
        selected = []
        for _ in range(self.population_size):
            tournament = random.sample(self.population, 3)
            winner = max(tournament, key=lambda x: self.fitness_function(x))
            selected.append(winner)
        return selected

    def crossover(self, parent1: RouteParameters, parent2: RouteParameters) -> RouteParameters:
        if random.random() > self.crossover_rate:
            return random.choice([parent1, parent2])
        return RouteParameters(
            waypoints=parent1.waypoints,
            altitude=(parent1.altitude + parent2.altitude) / 2,
            speed=(parent1.speed + parent2.speed) / 2,
            priority=parent1.priority if random.random() < 0.5 else parent2.priority,
            battery_usage=(parent1.battery_usage + parent2.battery_usage) / 2
        )

    def mutate(self, route: RouteParameters) -> RouteParameters:
        if random.random() > self.mutation_rate:
            return route
        new_altitude = max(self.min_altitude, min(self.max_altitude, route.altitude + random.uniform(-20, 20)))
        new_speed = max(self.min_speed, min(self.max_speed, route.speed + random.uniform(-1, 1)))
        return RouteParameters(
            waypoints=route.waypoints,
            altitude=new_altitude,
            speed=new_speed,
            priority=route.priority if random.random() < 0.9 else random.choice(['safety', 'distance', 'time']),
            battery_usage=route.battery_usage
        )

    async def predict(self, input_data: Dict, weather_data: Optional[Dict] = None, avoid_areas: Optional[List] = None) -> Dict:
        """Predict optimal parameters and metrics for a given route."""
        start_time = datetime.now()
        self.weather_data = weather_data
        self.avoid_areas = avoid_areas if avoid_areas else []

        initial_route = RouteParameters(
            waypoints=input_data.get("route", []),
            altitude=input_data.get("altitude", self.default_altitude),
            speed=input_data.get("uav_speed_mps", 15),
            priority=input_data.get("priority", "shortest"),
            battery_usage=100.0
        )

        self.initialize_population(initial_route)
        best_route = None
        best_score = -float('inf')

        for generation in range(self.max_generations):
            scores = [self.fitness_function(route) for route in self.population]
            current_best = max(scores)
            current_avg = sum(scores) / len(scores)

            if (generation + 1) % 10 == 0:
                print(f"Generation {generation+1}: Best={current_best:.3f}, Avg={current_avg:.3f}")

            if current_best > best_score:
                best_score = current_best
                best_route = self.population[scores.index(current_best)]
                if best_score >= self.target_score:
                    print(f"Reached target score {self.target_score}")
                    break

            selected = self.selection()
            new_population = []
            while len(new_population) < self.population_size:
                parent1, parent2 = random.sample(selected, 2)
                child = self.crossover(parent1, parent2)
                child = self.mutate(child)
                new_population.append(child)
            self.population = new_population

        if not best_route:
            return {
                "metadata": {
                    "status": "error",
                    "reason": "Prediction failed",
                    "timestamp": datetime.now().isoformat() + "Z"
                }
            }

        total_distance = self._calculate_total_distance(best_route.waypoints)
        total_time = (total_distance / (best_route.speed * 1000 / 3600)) * 60 if total_distance > 0 else 0.0
        feature_vector = self._build_feature_vector(best_route)
        columns = ['points_count', 'mean_lon', 'mean_lat', 'mean_alt', 'lon_variance', 'lat_variance',
                   'mean_look_alt', 'mean_look_heading', 'mean_look_tilt', 'mean_look_range',
                   'temperature', 'wind_speed', 'wind_direction', 'wind_gust', 'precipitation',
                   'humidity', 'pressure', 'cloud_cover']
        df = pd.DataFrame([feature_vector], columns=columns)
        scaled_features = self.scaler.transform(df)
        
        length_pred = self.model_length.predict(scaled_features)[0]
        battery_pred = float(self.model_battery.predict(scaled_features)[0])  # Преобразование в float

        result = {
            "predicted_parameters": {
                "altitude": round(best_route.altitude, 2),
                "speed_mps": round(best_route.speed, 2),
                "priority": best_route.priority
            },
            "predicted_metrics": {
                "fitness_score": float(best_score),
                "total_distance_m": round(total_distance, 2),
                "total_time_min": round(total_time, 2),
                "battery_consumption": round(battery_pred, 2),
                "safety_risk": self._estimate_safety_risk(best_route)
            },
            "metadata": {
                "status": "success",
                "timestamp": datetime.now().isoformat() + "Z",
                "algorithm": "GA-Predictor"
            }
        }

        self._save_prediction_result(result, input_data.get("mission_id", "unknown"))
        return result

    def _estimate_safety_risk(self, route: RouteParameters) -> float:
        """Estimate safety risk based on altitude and speed."""
        risk = 0.0
        if route.altitude < 100:
            risk += 0.5 * (100 - route.altitude) / 50
        elif route.altitude > 200:
            risk += 0.3 * (route.altitude - 200) / 50
        if route.speed > 15:
            risk += 0.4 * (route.speed - 15) / 10
        return min(1.0, risk)

    def _save_prediction_result(self, result: Dict, mission_id: str):
        """Save prediction result to JSON file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.results_dir}/prediction_{mission_id}_{timestamp}.json"
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving prediction: {e}")

# Пример использования (для тестирования)
if __name__ == "__main__":
    config = {
        "data_paths": {
            "results_dir": "data_new/prediction_results",
            "model_length_path": "data_new/models/xgboost_model_length.pkl",
            "model_battery_path": "data_new/models/xgboost_model_battery.pkl",
            "scaler_path": "data_new/models/scaler.pkl"
        },
        "optimization_parameters": {
            "ga_parameters": {
                "population_size": 50,
                "mutation_rate": 0.1,
                "crossover_rate": 0.8,
                "max_generations": 100,
                "target_score": 0.9
            },
            "min_altitude": 100,
            "max_altitude": 250
        },
        "drone_parameters": {
            "min_speed_mps": 5,
            "max_speed_mps": 25
        }
    }
    
    predictor = GAPredictor(config)
    sample_route = {
        "route": [
            {"lat": 52.01832279471409, "lon": 18.52153240950378, "alt": 109.4085912105433},
            {"lat": 52.01441813628643, "lon": 18.52540070535803, "alt": 109.4084969581791}
        ],  # Добавлен второй пункт для расчета расстояния
        "altitude": 150.0,
        "uav_speed_mps": 15.0,
        "priority": "shortest",
        "mission_id": "test_mission"
    }
    weather_data = {
        "current_weather": {
            "temperature": 20.0,
            "wind_speed": 5.0,
            "wind_direction": 180.0,
            "precipitation": 0.0
        },
        "forecast": [{"wind_gusts": 10.0, "humidity": 70.0, "pressure": 1013.0, "cloudcover": 30.0}]
    }
    
    # Выполняем асинхронный вызов с использованием asyncio.run
    result = asyncio.run(predictor.predict(sample_route, weather_data))
    print(result)