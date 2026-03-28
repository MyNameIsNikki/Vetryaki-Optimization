from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
import time

from routing.route_manager import RouteManager

class RouterService:
    @staticmethod
    def get_optimized_path(
        db_session: Session = None,
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
            if db_session and mission_id:
                route_manager = RouteManager(
                    db_session=db_session,
                    mission_id=mission_id,
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