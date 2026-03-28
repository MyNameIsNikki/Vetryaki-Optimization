import sys
import os
import json
from datetime import datetime

# Добавляем корень проекта в sys.path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

import xml.etree.ElementTree as ET
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import xgboost as xgb
from xgboost import plot_importance
import glob
import joblib
import asyncio
import aiohttp
from server.src.weather.weather_api import weather_api
from server.src.weather.data_parse import WeatherDataParser
from server.src.routing.coordinates_parse_kml import GetCoordinatesWindTurbines
from server.src.routing.route_manager import RouteManager


# 1. Загрузка и подготовка данных

async def parse_kml_file(filepath, session):
    """Парсинг KML-файла, получение погодных данных и оптимизация маршрута."""
    # Парсинг координат с помощью GetCoordinatesWindTurbines
    parser = GetCoordinatesWindTurbines(filepath, height=90)
    try:
        coordinates = parser.parseCoordinates()
    except ValueError as e:
        print(f"Ошибка парсинга {filepath}: {e}")
        return None, None, None, None
    
    if not coordinates:
        return None, None, None, None

    # Средние координаты для запроса погоды
    lons = [coord[1] for coord in coordinates]
    lats = [coord[0] for coord in coordinates]
    avg_lon = np.mean(lons) if lons else 0
    avg_lat = np.mean(lats) if lats else 0
    
    # Получение погодных данных
    weather_parser = WeatherDataParser(avg_lat, avg_lon, location_name=os.path.basename(filepath))
    try:
        await weather_parser.fetch_data(session)
        weather_data = weather_parser.parse_weather_data(target_time=datetime.now())
        if weather_data and 'current_weather' in weather_data:
            print(f"Погодные данные для {filepath}: {weather_data['current_weather']}")
        else:
            weather_data = {'current_weather': {}, 'forecast': []}
    except Exception as e:
        weather_data = {'current_weather': {}, 'forecast': []}
    
    # Оптимизация маршрута
    rm = RouteManager(
        kml_file=filepath,
        height=90,
        optimizer="ga",
        start=0,
        pop_size=50,
        max_gen=200,
        mutation_rate=0.1,
        crossover_rate=0.8,
        alpha=1,
        beta=2,
        theta_max=180
    )
    
    best_path, best_length = None, float('inf')
    
    # Попытка с GA
    try:
        ga_path, ga_length = rm.optimize_route()
        if ga_path and ga_length < best_length:
            best_path, best_length = ga_path, ga_length
    except ValueError as e:
        print(f"GA не сработал для {filepath}: {e}")
    
    # Попытка с ACO, если GA не сработал
    if best_path is None:
        rm.optimizer = "aco"
        try:
            aco_path, aco_length = rm.optimize_route()
            if aco_path and aco_length < best_length:
                best_path, best_length = aco_path, aco_length
        except ValueError as e:
            print(f"ACO не сработал для {filepath}: {e}")
            return None, None, None, None
    
    if best_path is None:
        print(f"Не удалось оптимизировать маршрут для {filepath}")
        return None, None, None, None
    
    # Парсинг KML для параметров lookAt
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
        namespace = {'kml': 'http://www.opengis.net/kml/2.2'}
        placemarks = root.findall('.//kml:Placemark', namespace)
    except ET.ParseError as e:
        placemarks = []

    look_alts, look_headings, look_tilts, look_ranges = [], [], [], []
    for placemark in placemarks:
        look_at = placemark.find('kml:LookAt', namespace)
        if look_at is not None:
            try:
                look_alts.append(float(look_at.find('kml:altitude', namespace).text))
                look_headings.append(float(look_at.find('kml:heading', namespace).text))
                look_tilts.append(float(look_at.find('kml:tilt', namespace).text))
                look_ranges.append(float(look_at.find('kml:range', namespace).text))
            except (AttributeError, ValueError) as e:
                continue
    
    # Расчет затрат батареи
    max_length = 10000  # Предполагаемый максимум длины маршрута в метрах
    battery_consumption = (best_length / max_length) * 100 if best_length else 0
    
    # Расчет параметров и метрик
    altitude = np.mean([coord[2] for coord in coordinates]) if coordinates else 80.0  # Средняя высота или 80.0 по умолчанию
    speed_mps = 15  # Скорость дрона 15 м/с
    speed_kmh = speed_mps * 3.6
    total_distance_km = best_length / 1000 if best_length else 0
    total_time_min = (total_distance_km / speed_kmh) * 60 if total_distance_km else 0
    fitness_score = 1 / (1 + best_length / 1000) if best_length else 0
    safety_risk = 0.1 if weather_data and weather_data.get('current_weather', {}).get('wind_speed', 0) < 10 else 0.3
    
    # Оценка пригодности маршрута
    route_suitability = (1 - (battery_consumption / 100)) * (1 - safety_risk) * fitness_score
    print(f"Оценка пригодности маршрута для {os.path.basename(filepath)}: {route_suitability:.4f}")
    
    # Формирование результата
    result = {
        "predicted_parameters": {
            "altitude": altitude,
            "speed": speed_kmh,
            "priority": "shortest"
        },
        "predicted_metrics": {
            "fitness_score": fitness_score,
            "total_distance_km": total_distance_km,
            "total_time_min": total_time_min,
            "battery_consumption": battery_consumption,
            "safety_risk": safety_risk,
            "route_suitability": route_suitability
        },
        "metadata": {
            "status": "success" if best_path else "failed",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "algorithm": "GA-Predictor"
        }
    }
    
    # Формирование признаков для модели
    features = [
        len(placemarks),  # Количество точек
        np.mean(lons) if lons else 0,  # Средняя долгота
        np.mean(lats) if lats else 0,  # Средняя широта
        altitude,  # Средняя высота
        np.var(lons) if lons else 0,  # Дисперсия долготы
        np.var(lats) if lats else 0,  # Дисперсия широты
        np.mean(look_alts) if look_alts else 0,  # Средняя высота обзора
        np.mean(look_headings) if look_headings else 0,  # Средний угол направления
        np.mean(look_tilts) if look_tilts else 0,  # Средний наклон
        np.mean(look_ranges) if look_ranges else 0,  # Средний диапазон
        weather_data['current_weather'].get('temperature', 0),
        weather_data['current_weather'].get('wind_speed', 0),
        weather_data['current_weather'].get('wind_direction', 0),
        weather_data['forecast'][0].get('wind_gusts', 0) if weather_data.get('forecast') and weather_data['forecast'] else 0,
        weather_data['current_weather'].get('precipitation', 0),
        weather_data['forecast'][0].get('humidity', 0) if weather_data.get('forecast') and weather_data['forecast'] else 0,
        weather_data['forecast'][0].get('pressure', 0) if weather_data.get('forecast') and weather_data['forecast'] else 0,
        weather_data['forecast'][0].get('cloudcover', 0) if weather_data.get('forecast') and weather_data['forecast'] else 0
    ]
    
    return features, best_length, battery_consumption, result

async def load_and_preprocess_data(kml_files):
    """Загрузка данных из всех KML-файлов."""
    features = []
    route_lengths = []
    battery_consumptions = []
    prediction_results = []
    
    async with aiohttp.ClientSession() as session:
        for filepath in kml_files:
            file_features, route_length, battery_consumption, result = await parse_kml_file(filepath, session)
            if file_features is not None:
                features.append(file_features)
                route_lengths.append(route_length)
                battery_consumptions.append(battery_consumption)
                prediction_results.append(result)
                # Сохранение результата в prediction_results
                filename = os.path.splitext(os.path.basename(filepath))[0] + '_result.json'
                output_dir = os.path.join(project_root, 'data_new', 'prediction_results')
                os.makedirs(output_dir, exist_ok=True)
                with open(os.path.join(output_dir, filename), 'w') as f:
                    json.dump(result, f, indent=4)
    
    # Создаем DataFrame
    columns = [
        'points_count', 'mean_lon', 'mean_lat', 'mean_alt', 'lon_variance', 'lat_variance',
        'mean_look_alt', 'mean_look_heading', 'mean_look_tilt', 'mean_look_range',
        'temperature', 'wind_speed', 'wind_direction', 'wind_gust', 'precipitation',
        'humidity', 'pressure', 'cloud_cover'
    ]
    
    X = pd.DataFrame(features, columns=columns)
    y_length = pd.Series(route_lengths, name='route_length')
    y_battery = pd.Series(battery_consumptions, name='battery_consumption')
    
    return X, y_length, y_battery, prediction_results

# Загрузка всех KML-файлов
kml_files = glob.glob(os.path.join(project_root, 'server', 'src', 'uploads', '*.kml'))  # Поиск в server/src/uploads
if not kml_files:
    raise FileNotFoundError("KML-файлы не найдены в server/src/uploads")

# Запуск асинхронной загрузки данных
print("Запуск асинхронной обработки данных...")
try:
    loop = asyncio.get_event_loop()
    X, y_length, y_battery, prediction_results = loop.run_until_complete(load_and_preprocess_data(kml_files))
except Exception as e:
    print(f"Ошибка при обработке данных: {e}")
    raise

# 2. Разделение данных и нормализация
print("\nШаг 2: Разделение данных и нормализация...")

# Разделение на обучающую и тестовую выборки
X_train, X_test, y_length_train, y_length_test = train_test_split(
    X, y_length, test_size=0.2, random_state=42
)
_, _, y_battery_train, y_battery_test = train_test_split(
    X, y_battery, test_size=0.2, random_state=42
)

# Нормализация данных
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 3. Обучение модели XGBoost для длины маршрута
print("\nШаг 3: Обучение модели XGBoost для длины маршрута...")

try:
    model_length = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42
    )
    
    model_length.fit(X_train_scaled, y_length_train,
                     eval_set=[(X_test_scaled, y_length_test)],
                     early_stopping_rounds=20,
                     verbose=10)
    
except TypeError as e:
    print(f"Ошибка: {e}")
    print("Пробуем альтернативный метод...")
    model_length.fit(X_train_scaled, y_length_train)
    print("Модель для длины маршрута обучена без early stopping")

# Обучение модели XGBoost для затрат батареи
print("\nШаг 3: Обучение модели XGBoost для затрат батареи...")

try:
    model_battery = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42
    )
    
    model_battery.fit(X_train_scaled, y_battery_train,
                      eval_set=[(X_test_scaled, y_battery_test)],
                      early_stopping_rounds=20,
                      verbose=10)
    
except TypeError as e:
    print(f"Ошибка: {e}")
    print("Пробуем альтернативный метод...")
    model_battery.fit(X_train_scaled, y_battery_train)
    print("Модель для затрат батареи обучена без early stopping")

# 4. Оценка моделей
print("\nШаг 4: Оценка моделей...")

# Предсказание длины маршрута
y_length_pred = model_length.predict(X_test_scaled)
mse_length = mean_squared_error(y_length_test, y_length_pred)
rmse_length = np.sqrt(mse_length)
r2_length = r2_score(y_length_test, y_length_pred)

print(f"\nРезультаты оценки для длины маршрута:")
print(f"- MSE: {mse_length:.4f}")
print(f"- RMSE: {rmse_length:.4f}")
print(f"- R² Score: {r2_length:.4f}")

# Предсказание затрат батареи
y_battery_pred = model_battery.predict(X_test_scaled)
mse_battery = mean_squared_error(y_battery_test, y_battery_pred)
rmse_battery = np.sqrt(mse_battery)
r2_battery = r2_score(y_battery_test, y_battery_pred)

print(f"\nРезультаты оценки для затрат батареи:")
print(f"- MSE: {mse_battery:.4f}")
print(f"- RMSE: {rmse_battery:.4f}")
print(f"- R² Score: {r2_battery:.4f}")

# 5. Визуализация результатов
print("\nШаг 5: Визуализация результатов...")

# График важности признаков для длины маршрута
plt.figure(figsize=(10, 6))
plot_importance(model_length)
plt.title('Важность признаков для длины маршрута')
plt.tight_layout()
graphics_dir = os.path.join(project_root, 'data_new', 'graphics')
os.makedirs(graphics_dir, exist_ok=True)
plt.savefig(os.path.join(graphics_dir, 'feature_importance_length.png'))
plt.close()

# График важности признаков для затрат батареи
plt.figure(figsize=(10, 6))
plot_importance(model_battery)
plt.title('Важность признаков для затрат батареи')
plt.tight_layout()
plt.savefig(os.path.join(graphics_dir, 'feature_importance_battery.png'))
plt.close()

# График реальных vs предсказанных значений для длины маршрута
plt.figure(figsize=(8, 8))
plt.scatter(y_length_test, y_length_pred, alpha=0.6)
plt.plot([y_length.min(), y_length.max()], [y_length.min(), y_length.max()], 'k--', lw=2)
plt.xlabel('Реальная длина маршрута (м)')
plt.ylabel('Предсказанная длина маршрута (м)')
plt.title('Реальная vs Предсказанная длина маршрута')
plt.tight_layout()
plt.savefig(os.path.join(graphics_dir, 'predictions_vs_actual_length.png'))
plt.close()

# График реальных vs предсказанных значений для затрат батареи
plt.figure(figsize=(8, 8))
plt.scatter(y_battery_test, y_battery_pred, alpha=0.6)
plt.plot([y_battery.min(), y_battery.max()], [y_battery.min(), y_battery.max()], 'k--', lw=2)
plt.xlabel('Реальные затраты батареи (%)')
plt.ylabel('Предсказанные затраты батареи (%)')
plt.title('Реальные vs Предсказанные затраты батареи')
plt.tight_layout()
plt.savefig(os.path.join(graphics_dir, 'predictions_vs_actual_battery.png'))
plt.close()

# 6. Сохранение моделей и scaler
print("\nШаг 6: Сохранение моделей и scaler...")

models_dir = os.path.join(project_root, 'data_new', 'models')
os.makedirs(models_dir, exist_ok=True)
joblib.dump(model_length, os.path.join(models_dir, 'xgboost_model_length.pkl'))
joblib.dump(model_battery, os.path.join(models_dir, 'xgboost_model_battery.pkl'))
joblib.dump(scaler, os.path.join(models_dir, 'scaler.pkl'))

print("\nОбучение завершено!")
print("Сохраненные файлы:")
print("- xgboost_model_length.pkl (модель для длины маршрута) в data_new/models")
print("- xgboost_model_battery.pkl (модель для затрат батареи) в data_new/models")
print("- scaler.pkl (нормализатор) в data_new/models")
print("- optimization_results.json (результаты оптимизации) в data_new/prediction_results")
print("- feature_importance_length.png (график важности признаков для длины) в data_new/graphics")
print("- feature_importance_battery.png (график важности признаков для батареи) в data_new/graphics")
print("- predictions_vs_actual_length.png (график предсказаний для длины) в data_new/graphics")
print("- predictions_vs_actual_battery.png (график предсказаний для батареи) в data_new/graphics")