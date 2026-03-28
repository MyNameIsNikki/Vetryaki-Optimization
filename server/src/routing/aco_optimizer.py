import numpy as np
import random
from shapely.geometry import LineString, Polygon

class ACO:
    def __init__(self, coordinates, obstacles, start, num_ants, max_iter, alpha, beta, rho, q, theta_max):
        self.coordinates = coordinates
        self.obstacles = obstacles
        self.start = start
        self.num_ants = num_ants
        self.max_iter = max_iter
        self.alpha = alpha
        self.beta = beta
        self.rho = rho
        self.q = q
        self.theta_max = theta_max

    def euclidean_distance(self, p1, p2):
        return np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2 + (p2[2] - p1[2])**2)

    def is_valid_turn(self, p1, p2, p3):
        if not p3:
            return True
        v1 = np.array(p2) - np.array(p1)
        v2 = np.array(p3) - np.array(p2)
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        angle = np.degrees(np.arccos(np.clip(cos_angle, -1, 1)))
        return angle <= self.theta_max

    def is_obstacle_free(self, p1, p2):
        line = LineString([(p1[0], p1[1]), (p2[0], p2[1])])
        for obstacle in self.obstacles:
            if line.intersects(obstacle):
                return False
        return True

    def create_graph(self):
        n = len(self.coordinates)
        graph = {}
        distances = {}
        for i in range(n):
            graph[i] = []
            for j in range(n):
                if i != j and self.is_obstacle_free(self.coordinates[i], self.coordinates[j]):
                    graph[i].append(j)
                    distances[(i, j)] = self.euclidean_distance(self.coordinates[i], self.coordinates[j])
        return graph, distances

    def initialize_pheromones(self, graph):
        pheromones = {}
        for i in graph:
            for j in graph[i]:
                pheromones[(i, j)] = 1.0
        return pheromones

    def choose_next_node(self, current, allowed, pheromones, distances, path):
        if not allowed:
            return None
        probs = []
        total = 0
        for next_node in allowed:
            if len(path) >= 2 and not self.is_valid_turn(self.coordinates[path[-2]], self.coordinates[current], self.coordinates[next_node]):
                continue
            tau = pheromones.get((current, next_node), 1.0)
            eta = 1.0 / distances[(current, next_node)]
            prob = (tau ** self.alpha) * (eta ** self.beta)
            probs.append((next_node, prob))
            total += prob
        if not probs:
            return None
        probs = [(n, p / total) for n, p in probs]
        r = random.random()
        cum_prob = 0
        for node, prob in probs:
            cum_prob += prob
            if r <= cum_prob:
                return node
        return probs[-1][0]

    def aco_optimizer(self):
        graph, distances = self.create_graph()
        pheromones = self.initialize_pheromones(graph)
        best_path = None
        best_length = float('inf')

        for _ in range(self.max_iter):
            paths = []
            lengths = []
            for _ in range(self.num_ants):
                current = self.start
                path = [current]
                visited = {current}
                while len(visited) < len(self.coordinates):
                    allowed = [n for n in graph[current] if n not in visited]
                    next_node = self.choose_next_node(current, allowed, pheromones, distances, path)
                    if not next_node:
                        break
                    path.append(next_node)
                    visited.add(next_node)
                    current = next_node
                if len(visited) == len(self.coordinates):
                    path.append(self.start)
                    length = sum(distances[(path[i], path[i+1])] for i in range(len(path)-1))
                    paths.append(path)
                    lengths.append(length)
                    if length < best_length:
                        best_length = length
                        best_path = path

            for edge in pheromones:
                pheromones[edge] *= (1 - self.rho)
            for path, length in zip(paths, lengths):
                for i in range(len(path)-1):
                    edge = (path[i], path[i+1])
                    pheromones[edge] = pheromones.get(edge, 0) + self.q / length

        return best_path, best_length