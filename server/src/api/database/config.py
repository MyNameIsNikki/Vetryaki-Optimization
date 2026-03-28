# server/src/api/database/config.py
from configparser import ConfigParser
from pathlib import Path

def load_config(filename="database.ini", section="postgresql"):
    parser = ConfigParser()
    
    # Пробуем разные пути
    possible_paths = [
        Path(__file__).parent.parent.parent.parent / "assets" / "configs" / filename,  # server/assets/configs/
        Path(__file__).parent.parent.parent / "assets" / "configs" / filename,  # server/src/assets/configs/
        Path(__file__).parent / filename,  # database.ini в той же папке
    ]
    
    config_path = None
    for path in possible_paths:
        if path.exists():
            config_path = path
            break
    
    if not config_path:
        raise Exception(f"Config file not found. Tried: {possible_paths}")
    
    print(f"Loading config from: {config_path}")
    parser.read(config_path)
    
    config = {}
    if parser.has_section(section):
        params = parser.items(section)
        for param in params:
            config[param[0]] = param[1]
        print(f"Loaded: user={config.get('user')}, dbname={config.get('dbname')}")
    else:
        raise Exception(f"Section {section} not found in {config_path}")
    
    return config