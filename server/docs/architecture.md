.
├── api
├── assets
│   ├── configs
│   │   ├── input_data.json
│   │   └── weather_stats.json
│   ├── models
│   └── textures
├── database-backup
│   ├── veter_db_back.sql
│   └── winddb.png
├── docs
│   ├── api.md
│   ├── architecture.md
│   └── user_manual.md
├── interface
├── README.md
├── requirements.txt
├── src
│   ├── database-init
│   │   ├── databaseconn.py
│   │   └── weather
│   │       ├── data_parse.py
│   │       ├── get_json.py
│   │       ├── __pycache__
│   │       │   ├── data_parse.cpython-311.pyc
│   │       │   └── weather_api.cpython-311.pyc
│   │       ├── rostov_weather.json
│   │       ├── taganrog_weather.json
│   │       ├── weather_api.py
│   │       └── weather_pipeline.log
│   ├── data_processing
│   │   ├── annotation.py
│   │   ├── sensor_processor.py
│   │   └── video_processor.py
│   ├── defect_detection
│   │   ├── mask_rcnn.py
│   │   ├── resnet_classifier.py
│   │   └── yolo_detector.py
│   ├── failure_prediction
│   │   ├── deepsurv_model.py
│   │   ├── gru_model.py
│   │   └── prediction_manager.py
│   ├── routing
│   │   ├── aco_optimizer.py
│   │   ├── coordinates
│   │   │   └── 48.221051lo40.301775.kml
│   │   ├── coordinates_parse_kml.py
│   │   ├── drone_path.html
│   │   ├── drone_path.json
│   │   ├── ga_optimizer.py
│   │   ├── __pycache__
│   │   │   ├── aco_optimizer.cpython-311.pyc
│   │   │   └── coordinates_parse_kml.cpython-311.pyc
│   │   ├── route_manager.py
│   │   └── router_pipeline.log
│   └── simulation
│       ├── unreal_bridge.cpp
│       ├── unreal_bridge.py
│       └── visualization.py
└── tests

21 directories, 40 files
