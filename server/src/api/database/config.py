from configparser import ConfigParser
from pathlib import Path

def load_config(filename="database.ini", section="postgresql"):
    parser = ConfigParser()
    
    # Ищем файл в той же папке
    config_path = Path(__file__).parent / filename
    
    print(f"Looking for config at: {config_path}")
    print(f"File exists: {config_path.exists()}")
    
    if not config_path.exists():
        raise Exception(f"Config file not found at {config_path}")
    
    parser.read(config_path)
    
    config = {}
    if parser.has_section(section):
        params = parser.items(section)
        for param in params:
            config[param[0]] = param[1]
        print(f"Config loaded successfully!")
    else:
        raise Exception(f"Section {section} not found in {filename}")

    return config