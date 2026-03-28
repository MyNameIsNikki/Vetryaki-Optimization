from pyproj import Proj
from shapely.geometry import LineString, Polygon
import folium
import json
from sqlalchemy.orm import Session
from routing.coordinates_parse_kml import GetCoordinatesWindTurbines
from routing.aco_optimizer import ACO
from routing.ga_optimizer import GA

class RouteManager:
    def __init__(self, 
                kml_file=None, 
                height=None, 
                optimizer=None, 
                start=0, 
                num_ants=50, 
                max_iter=200, 
                alpha=1, 
                beta=2, 
                rho=0.1, 
                q=100, 
                theta_max=180,
                tiles_path=None, 
                pop_size=50, 
                max_gen=200, 
                mutation_rate=0.1, 
                crossover_rate=0.8,
                db_session=None,
                mission_id=None):
        
        self.kml_file = kml_file
        self.height = height
        self.db_session = db_session
        self.mission_id = mission_id
        self.optimizer = optimizer
        self.start = start
        self.max_iter = max_iter
        self.alpha = alpha
        self.beta = beta
        self.theta_max = theta_max
        self.coordinates_latlon = None
        self.coordinates_meters = None
        self.obstacles = []

        self.tiles_path = tiles_path
        self.num_ants = num_ants
        self.rho = rho
        self.q = q
        
        self.pop_size = pop_size
        self.max_gen = max_gen
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate

    def get_coordinates(self):
        if self.db_session and self.mission_id:
            parser = GetCoordinatesWindTurbines(
                db_session=self.db_session,
                mission_id=self.mission_id,
                height=self.height
            )
        else:
            parser = GetCoordinatesWindTurbines(
                filepath=self.kml_file,
                height=self.height
            )
        
        self.coordinates_latlon = parser.parseCoordinates()
        if not self.coordinates_latlon:
            raise ValueError("Не удалось получить координаты")
        return self.coordinates_latlon

    def latlon_to_meters(self):
        proj = Proj(proj='utm', zone=37, ellps='WGS84')
        self.coordinates_meters = []
        for lat, lon, z in self.coordinates_latlon:
            x, y = proj(lon, lat)
            self.coordinates_meters.append((x, y, z))
        return self.coordinates_meters

    def optimize_route(self):
        if not self.coordinates_meters:
            self.get_coordinates()
            self.latlon_to_meters()
            
        if self.optimizer == "aco":
            aco = ACO(
                self.coordinates_meters,
                obstacles=self.obstacles,
                start=self.start,
                num_ants=self.num_ants,
                max_iter=self.max_iter,
                alpha=self.alpha,
                beta=self.beta,
                rho=self.rho,
                q=self.q,
                theta_max=self.theta_max
            )
            best_path, best_length = aco.aco_optimizer()
        elif self.optimizer == "ga":
            ga = GA(
                coordinates=self.coordinates_meters,
                obstacles=self.obstacles,
                start=self.start,
                pop_size=self.pop_size,
                max_gen=self.max_gen,
                mutation_rate=self.mutation_rate,
                crossover_rate=self.crossover_rate,
                alpha=self.alpha,
                beta=self.beta,
                theta_max=self.theta_max
            )
            best_path, best_length = ga.ga_optimizer()
        else:
            raise ValueError(f"Неизвестный оптимизатор: {self.optimizer}")
        
        if best_path is None:
            raise ValueError(f"{self.optimizer.upper()} не смог найти валидный маршрут")
        return best_path, best_length

    def export_path_for_simulation(self, path):
        path_data = {
            "turbines": [{"id": i+1, "lat": lat, "lon": lon, "z": z} for i, (lat, lon, z) in enumerate(self.coordinates_latlon)],
            "path": [{"id": i+1, "x": self.coordinates_meters[i][0], "y": self.coordinates_meters[i][1], "z": self.coordinates_meters[i][2]} for i in path]
        }
        return path_data