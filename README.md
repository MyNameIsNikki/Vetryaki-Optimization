# 🌬️ WTM — Wind Turbine Maintenance System

<p align="center">
  <img src="renderer/images/home/windturbines.jpg" width="100%" alt="Wind Turbine Maintenance"/>
</p>

<p align="center">
  <b>Интеллектуальная система планирования маршрутов БПЛА для инспекции ветрогенераторов</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-blue">
  <img src="https://img.shields.io/badge/FastAPI-0.116+-green">
  <img src="https://img.shields.io/badge/React-18+-61DAFB">
  <img src="https://img.shields.io/badge/Electron-28+-47848F">
  <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1">
  <img src="https://img.shields.io/badge/YOLOv11-AI-00FFFF">
  <img src="https://img.shields.io/badge/License-MIT-yellow">
</p>

---

## 🚀 О проекте

WTM — это комплексная система для автоматизации инспекции ветрогенераторов с использованием дронов.

Она объединяет:

* 🗺️ **Оптимизацию маршрутов** (ACO + Genetic Algorithm)
* 🤖 **AI-детекцию дефектов** (YOLOv11)
* 🎮 **3D симуляцию полета**
* 🌦️ **Учет погодных условий**
* 💾 **Управление миссиями и данными**

---

## ✨ Основные возможности

* 📍 Построение оптимальных маршрутов облёта турбин
* 🧠 Автоматическое обнаружение повреждений
* 🛰 Планирование миссий с учетом погоды
* 🎮 3D визуализация траектории
* 📊 История миссий и аналитика

---

## 🧱 Архитектура

```bash
Frontend (React + Electron)
        ↓
   FastAPI Backend
        ↓
 ┌───────────────┬───────────────┬───────────────┐
 │ Routing       │ Detection     │ Weather       │
 │ (ACO / GA)    │ (YOLOv11)     │ API           │
 └───────────────┴───────────────┴───────────────┘
        ↓
   PostgreSQL Database
```

---

## 🛠️ Технологии

### Backend

* Python 3.12+
* FastAPI
* SQLAlchemy
* PostgreSQL

### Frontend

* React + TypeScript
* Electron
* TailwindCSS

### Алгоритмы и AI

* ACO (Ant Colony Optimization)
* Genetic Algorithm
* YOLOv11 (PyTorch + OpenCV)

### Визуализация

* Leaflet (карты)
* Three.js (3D сцена)

---

## ⚡ Быстрый старт

### 1. Клонирование

```bash
git clone https://github.com/MyNameIsNikki/Vetryaki-Optimization.git
cd Vetryaki-Optimization
```

---

### 2. Настройка PostgreSQL

```sql
CREATE DATABASE wind_turbine_db; #Ну или как там вы назвали Вашу БД
```

Создай файл:

```
server/assets/configs/database.ini
```

```ini
[postgresql] #Тут пишите Ваше подключение
host=localhost
port=5432
user=postgres
password=your_password
dbname=wind_turbine_db
```

---

### 3. Backend

```bash
cd server

python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

pip install -r requirements.txt

cd src
uvicorn api.main:app --reload
```

📍 Weather API: https://open-meteo.com/
📄 Yolo Docs + API: https://docs.ultralytics.com/platform/api/#get-api-key

---

### 4. Frontend (Electron)

```bash
npm install

cd electron && npm install
cd ../renderer && npm install

cd ..
npm start
```

---

### 🐳 Docker

```bash
docker-compose up -d
```

---

## 📡 API (основное)

| Метод | Endpoint             | Описание          |
| ----- | -------------------- | ----------------- |
| POST  | `/api/upload`        | Загрузка KML/DB   |
| POST  | `/api/dronepath_aco` | ACO маршрут       |
| POST  | `/api/dronepath_ga`  | GA маршрут        |
| POST  | `/api/detect`        | Детекция дефектов |
| POST  | `/api/weather`       | Погода            |
| GET   | `/api/missions/list` | Миссии            |

---

## 🧠 Алгоритмы

### ACO (Ant Colony Optimization)

* Оптимизация маршрута
* Учет расстояния и углов
* Настраиваемые параметры (α, β, ρ)

### Genetic Algorithm

* Эволюционный подход
* Кроссовер и мутации
* Поиск глобального минимума

---

## 🎮 3D Симуляция

* Визуализация маршрута
* Модель дрона
* Интерактивная сцена
* Интеграция с Three.js / Unreal Engine

---

## 📂 Структура проекта

```bash
.
├── data_new
│   ├── ga_predictor.py
│   ├── graphics
│   │   ├── feature_importance_battery.png
│   │   ├── feature_importance_length.png
│   │   ├── predictions_vs_actual_battery.png
│   │   └── predictions_vs_actual_length.png
│   ├── models
│   │   ├── scaler.pkl
│   │   ├── xgboost_model_battery.pkl
│   │   └── xgboost_model_length.pkl
│   ├── prediction_results
│   │   ├── 19810042-5b4f-4535-aec9-16d6e06c3cc7_48.221051lo40.301775_result.json
│   │   ├── 2851b8e0-17bc-4a73-b0f6-b44b4d609149_Untitled project(2)_result.json
│   │   ├── 4120fdd2-fa55-42cf-94fc-2d18ef1bf31b_Untitled project_result.json
│   │   ├── 7a035f78-7ead-44da-bd74-70e33fde43b9_Untitled project(1)_result.json
│   │   ├── 8bb35937-af14-4caa-8e70-6ed393d255d8_Untitled_project_result.json
│   │   ├── a929d204-a382-4201-8236-bc93d4afa03c_Untitled project(3)_result.json
│   │   ├── prediction_test_mission_20250803_190832.json
│   │   ├── prediction_test_mission_20250803_191413.json
│   │   ├── prediction_test_mission_20250803_191743.json
│   │   └── prediction_test_mission_20250803_192210.json
│   └── train_model.py
├── electron
│   ├── common
│   │   └── electron-commands.ts
│   ├── dist
│   │   ├── common
│   │   │   ├── electron-commands.js
│   │   │   └── electron-commands.js.map
│   │   ├── index.js
│   │   ├── index.js.map
│   │   ├── main-window.js
│   │   ├── main-window.js.map
│   │   ├── preload.js
│   │   ├── preload.js.map
│   │   └── utils
│   │       ├── get-device-specs.js
│   │       ├── get-device-specs.js.map
│   │       ├── local-storage.js
│   │       ├── local-storage.js.map
│   │       ├── logit.js
│   │       ├── logit.js.map
│   │       ├── show-notification.js
│   │       ├── show-notification.js.map
│   │       ├── slash.js
│   │       └── slash.js.map
│   ├── forge.config.js
│   ├── index.ts
│   ├── main-window.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── preload.ts
│   ├── tsconfig.json
│   └── utils
│       ├── get-device-specs.ts
│       ├── local-storage.ts
│       ├── logit.ts
│       ├── show-notification.ts
│       └── slash.ts
├── global.d.ts
├── package.json
├── package-lock.json
├── README.md
├── renderer
│   ├── components
│   │   ├── Dropdown.tsx
│   │   ├── HistoryCard.tsx
│   │   └── NavBar.tsx
│   ├── fonts
│   │   └── poppins
│   │       ├── Poppins-Black.ttf
│   │       ├── Poppins-Bold.ttf
│   │       ├── Poppins-ExtraBold.ttf
│   │       ├── Poppins-Medium.ttf
│   │       ├── Poppins-Regular.ttf
│   │       └── Poppins-SemiBold.ttf
│   ├── i18n.js
│   ├── images
│   │   ├── 3d
│   │   │   └── drone.png
│   │   ├── docs
│   │   │   └── docs.jpg
│   │   ├── grass.png
│   │   ├── home
│   │   │   └── windturbines.jpg
│   │   ├── readme
│   │   │   └── drone.png
│   │   ├── router
│   │   │   ├── art.jpg
│   │   │   ├── map-placeholder1.png
│   │   │   ├── map-placeholder2.png
│   │   │   ├── map-placeholder.png
│   │   │   └── picture.jpg
│   │   └── weather
│   │       ├── back.jpg
│   │       ├── Clear.svg
│   │       ├── Clouds.svg
│   │       ├── Cloud-wind.svg
│   │       ├── Drizzle.svg
│   │       ├── Moon.svg
│   │       ├── Night-rainy.svg
│   │       ├── Night.svg
│   │       ├── Preview.svg
│   │       ├── Rain.svg
│   │       ├── Snow.svg
│   │       ├── Thunderstorm.svg
│   │       └── Tonado.svg
│   ├── index.html
│   ├── locales
│   │   ├── en.json
│   │   └── ru.json
│   ├── main.tsx
│   ├── package.json
│   ├── package-lock.json
│   ├── pages
│   │   ├── App.jsx
│   │   ├── Detection.tsx
│   │   ├── Docs.tsx
│   │   ├── History.tsx
│   │   ├── Home.tsx
│   │   ├── Router.tsx
│   │   └── Weather.tsx
│   ├── postcss.config.js
│   ├── styles
│   │   └── globals.css
│   ├── tailwind.config.js
│   ├── threejsSimulation
│   │   ├── assets
│   │   │   ├── drone
│   │   │   │   ├── license.txt
│   │   │   │   ├── scene.bin
│   │   │   │   ├── scene.gltf
│   │   │   │   └── textures
│   │   │   │       ├── Material_27_metallicRoughness.png
│   │   │   │       ├── Material_27_normal.png
│   │   │   │       ├── Material_28_baseColor.png
│   │   │   │       ├── Material_28_metallicRoughness.png
│   │   │   │       ├── Material_28_normal.png
│   │   │   │       ├── Material_30_baseColor.png
│   │   │   │       ├── Material_30_metallicRoughness.png
│   │   │   │       ├── Material_30_normal.png
│   │   │   │       ├── Material_31_baseColor.png
│   │   │   │       ├── Material_31_metallicRoughness.png
│   │   │   │       ├── Material_31_normal.png
│   │   │   │       ├── Material_32_baseColor.png
│   │   │   │       ├── Material_33_baseColor.png
│   │   │   │       ├── Material_33_metallicRoughness.png
│   │   │   │       ├── Material_33_normal.png
│   │   │   │       ├── Material_34_baseColor.png
│   │   │   │       ├── Material_34_metallicRoughness.png
│   │   │   │       └── Material_34_normal.png
│   │   │   └── wind_turbine
│   │   │       ├── license.txt
│   │   │       ├── scene.bin
│   │   │       ├── scene.gltf
│   │   │       └── textures
│   │   │           └── Windmill_baseColor.png
│   │   ├── hooks
│   │   │   ├── useModelLoad.js
│   │   │   ├── useRouteData.js
│   │   │   ├── useSceneInit.js
│   │   │   └── useWeatherData.js
│   │   ├── pages
│   │   │   ├── menu.tsx
│   │   │   └── simulation.jsx
│   │   └── styles
│   │       └── Simulation.css
│   ├── tree.txt
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── server
│   ├── assets
│   │   └── configs
│   │       └── database.ini
│   ├── database-backup
│   │   ├── wind_db_back.sql
│   │   └── winddb.png
│   ├── docs
│   │   ├── api.md
│   │   ├── architecture.md
│   │   └── user_manual.md
│   ├── requirements.txt
│   └── src
│       ├── api
│       │   ├── database
│       │   │   ├── config.py
│       │   │   └── databaseconn.py
│       │   ├── logs
│       │   │   └── router_pipeline.log
│       │   ├── main.py
│       │   ├── modules
│       │   │   ├── __pycache__
│       │   │   │   ├── routerModule.cpython-311.pyc
│       │   │   │   └── weatherModule.cpython-311.pyc
│       │   │   ├── routerModule.py
│       │   │   └── weatherModule.py
│       │   ├── __pycache__
│       │   │   └── main.cpython-311.pyc
│       │   ├── routes
│       │   │   ├── __pycache__
│       │   │   │   └── router.cpython-311.pyc
│       │   │   └── router.py
│       │   └── service
│       │       ├── detectionService.py
│       │       ├── __pycache__
│       │       │   ├── detectionService.cpython-311.pyc
│       │       │   ├── routerService.cpython-311.pyc
│       │       │   └── weatherService.cpython-311.pyc
│       │       ├── routerService.py
│       │       └── weatherService.py
│       ├── data_processing
│       │   ├── annotation.py
│       │   ├── sensor_processor.py
│       │   └── video_processor.py
│       ├── defect_detection
│       │   ├── data
│       │   │   ├── best_turbine.pt
│       │   │   ├── input_folder
│       │   │   │   ├── 144_2048_3584_640_640_0_8192_5460_JPG_jpg.rf.4cb73c27668059fafb823f517eb74925.jpg
│       │   │   │   ├── 312_1653_3072_1536_640_640_0_8192_5460_jpg.rf.c3587aa4eced3bdc75a4e94761cd9d9f.jpg
│       │   │   │   ├── 37_jpg.rf.b6a3c0348bc1df9472df2b4418c5208c.jpg
│       │   │   │   ├── 40_1801_3072_2048_640_640_0_5184_3888_jpg.rf.f93bca46b3005dd612c27e1d3b240a9e.jpg
│       │   │   │   └── 47_512_3584_640_640_0_8192_5460_JPG_jpg.rf.a1304c56eccf8f2bd6d072de875ffd12.jpg
│       │   │   ├── YOLO11_Scan.ipynb
│       │   │   └── yolo11_scan.py
│       │   ├── mask_rcnn.py
│       │   ├── __pycache__
│       │   │   └── yolo_detector.cpython-311.pyc
│       │   ├── resnet_classifier.py
│       │   └── yolo_detector.py
│       ├── failure_prediction
│       │   ├── deepsurv_model.py
│       │   ├── gru_model.py
│       │   └── prediction_manager.py
│       ├── routing
│       │   ├── aco_optimizer.py
│       │   ├── coordinates_parse_kml.py
│       │   ├── ga_optimizer.py
│       │   ├── __pycache__
│       │   │   ├── aco_optimizer.cpython-311.pyc
│       │   │   ├── coordinates_parse_kml.cpython-311.pyc
│       │   │   ├── ga_optimizer.cpython-311.pyc
│       │   │   └── route_manager.cpython-311.pyc
│       │   └── route_manager.py
│       ├── simulation
│       │   ├── unreal_bridge.cpp
│       │   ├── unreal_bridge.py
│       │   └── visualization.py
│       ├── uploads
│       │   ├── 19810042-5b4f-4535-aec9-16d6e06c3cc7_48.221051lo40.301775.kml
│       │   ├── 2851b8e0-17bc-4a73-b0f6-b44b4d609149_Untitled project(2).kml
│       │   ├── 4120fdd2-fa55-42cf-94fc-2d18ef1bf31b_Untitled project.kml
│       │   ├── 7a035f78-7ead-44da-bd74-70e33fde43b9_Untitled project(1).kml
│       │   ├── 8bb35937-af14-4caa-8e70-6ed393d255d8_Untitled_project.kml
│       │   ├── a929d204-a382-4201-8236-bc93d4afa03c_Untitled project(3).kml
│       │   └── bd1d7c06-e37d-4778-a8e6-78886565f0e1_1.kml
│       └── weather
│           ├── data_parse.py
│           ├── __pycache__
│           │   ├── data_parse.cpython-311.pyc
│           │   └── weather_api.cpython-311.pyc
│           └── weather_api.py
└── tree.txt

62 directories, 204 files
```

---

## 🤝 Участие

1. Fork проекта
2. Создай ветку
3. Сделай изменения
4. Открой Pull Request

---

## 📝 Лицензия

MIT License © 2026 hook-team

---

## 📬 Контакты

* GitHub Issues
* [opik@sfedu.ru](mailto:opik@sfedu.ru)
* [nialei@sfedu.ru](mailto:nialei@sfedu.ru)

---

<p align="center">
  Сделано с ❤️ от разработчиков MyNameIsNikki и kr1p043k
</p>
