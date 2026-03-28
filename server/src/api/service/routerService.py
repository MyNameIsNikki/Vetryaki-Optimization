# server/src/api/service/routerService.py
from datetime import datetime
from typing import List, Optional
import time
import psycopg2
import os

from routing.route_manager import RouteManager

class RouterService:
    @staticmethod
    def get_optimized_path(
        db_session=None,
        mission_id: str = None,
        kml_file: str = None,
        height: float = None,
        optimizer: str = None,
        start: int = 0,
        num_ants: int = 50,
        max_iter: int = 200,
        alpha: float = 1,
        beta: float = 2,
        rho: float = 0.1,
        q: float = 100,
        theta_max: float = 180,
        pop_size: int = 50,
        max_gen: int = 200,
        mutation_rate: float = 0.1,
        crossover_rate: float = 0.8
    ):
        try:
            if mission_id:
                # Получаем координаты из БД напрямую через psycopg2
                os.environ['PGCLIENTENCODING'] = 'UTF8'
                
                conn = psycopg2.connect(
                    host="localhost",
                    port="5432",
                    user="postgres",
                    password="password",
                    database="wind_turbine_db"
                )
                
                cur = conn.cursor()
                
                # Получаем турбины для миссии
                cur.execute("""
                    SELECT wt.latitude, wt.longitude, wt.hub_height 
                    FROM mission_wind_turbines mwt
                    JOIN wind_turbine wt ON mwt.object_id = wt.id
                    WHERE mwt.mission_id = %s
                    ORDER BY mwt.inspection_order
                """, (mission_id,))
                
                rows = cur.fetchall()
                cur.close()
                conn.close()
                
                if not rows:
                    raise ValueError(f"No turbines found for mission {mission_id}")
                
                # Создаем временный файл с координатами
                import tempfile
                import json
                
                temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False)
                temp_file.write('<?xml version="1.0" encoding="UTF-8"?>\n')
                temp_file.write('<kml xmlns="http://www.opengis.net/kml/2.2">\n')
                temp_file.write('<Document>\n')
                
                for i, row in enumerate(rows):
                    lat, lon, z = row
                    temp_file.write(f'<Placemark>\n')
                    temp_file.write(f'<name>{i+1}</name>\n')
                    temp_file.write(f'<Point>\n')
                    temp_file.write(f'<coordinates>{lon},{lat},{height}</coordinates>\n')
                    temp_file.write(f'</Point>\n')
                    temp_file.write(f'</Placemark>\n')
                
                temp_file.write('</Document>\n')
                temp_file.write('</kml>\n')
                temp_file.close()
                
                kml_file = temp_file.name
                
                route_manager = RouteManager(
                    kml_file=kml_file,
                    height=height,
                    optimizer=optimizer,
                    start=start,
                    num_ants=num_ants,
                    max_iter=max_iter,
                    alpha=alpha,
                    beta=beta,
                    rho=rho,
                    q=q,
                    theta_max=theta_max,
                    pop_size=pop_size,
                    max_gen=max_gen,
                    mutation_rate=mutation_rate,
                    crossover_rate=crossover_rate
                )
                
                route_manager.get_coordinates()
                path, length = route_manager.optimize_route()
                data = route_manager.export_path_for_simulation(path)
                
                # Удаляем временный файл
                import os as os_module
                os_module.unlink(kml_file)
                
                return data, length
            else:
                route_manager = RouteManager(
                    kml_file=kml_file,
                    height=height,
                    optimizer=optimizer,
                    start=start,
                    num_ants=num_ants,
                    max_iter=max_iter,
                    alpha=alpha,
                    beta=beta,
                    rho=rho,
                    q=q,
                    theta_max=theta_max,
                    pop_size=pop_size,
                    max_gen=max_gen,
                    mutation_rate=mutation_rate,
                    crossover_rate=crossover_rate
                )
                
                route_manager.get_coordinates()
                path, length = route_manager.optimize_route()
                data = route_manager.export_path_for_simulation(path)
                
                return data, length
            
        except Exception as e:
            raise