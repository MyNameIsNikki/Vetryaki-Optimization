import numpy as np
import random
from shapely.geometry import LineString, Polygon
import uuid

class GA:
    def __init__(self, coordinates, obstacles, start, pop_size, max_gen, mutation_rate, crossover_rate, alpha, beta, theta_max):
        self.coordinates = coordinates
        self.obstacles = obstacles
        self.start = start
        self.pop_size = pop_size
        self.max_gen = max_gen
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.alpha = alpha
        self.beta = beta
        self.theta_max = theta_max
        self.n = len(coordinates)

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
        n = self.n
        graph = {}
        distances = {}
        for i in range(n):
            graph[i] = []
            for j in range(n):
                if i != j and self.is_obstacle_free(self.coordinates[i], self.coordinates[j]):
                    graph[i].append(j)
                    distances[(i, j)] = self.euclidean_distance(self.coordinates[i], self.coordinates[j])
        return graph, distances

    def initialize_population(self, graph):
        population = []
        nodes = list(range(self.n))
        nodes.remove(self.start)
        for _ in range(self.pop_size):
            path = [self.start] + random.sample(nodes, len(nodes)) + [self.start]
            if self.is_valid_path(path, graph):
                population.append(path)
            else:
                path = self.generate_valid_path(graph)
                if path:
                    population.append(path)
                else:
                    population.append([self.start, self.start])
        return population

    def generate_valid_path(self, graph):
        path = [self.start]
        visited = {self.start}
        current = self.start
        nodes = list(range(self.n))
        nodes.remove(self.start)
        random.shuffle(nodes)
        for next_node in nodes:
            if next_node in graph[current] and next_node not in visited:
                if len(path) >= 2:
                    if self.is_valid_turn(self.coordinates[path[-2]], self.coordinates[current], self.coordinates[next_node]):
                        path.append(next_node)
                        visited.add(next_node)
                        current = next_node
                else:
                    path.append(next_node)
                    visited.add(next_node)
                    current = next_node
        if len(visited) == self.n:
            path.append(self.start)
            return path
        return None

    def is_valid_path(self, path, graph):
        if len(path) != self.n + 1 or path[0] != self.start or path[-1] != self.start:
            return False
        visited = set()
        for i in range(len(path) - 1):
            current, next_node = path[i], path[i + 1]
            if (current not in graph and next_node not in graph) or current in visited and i < len(path) - 1:
                return False
            if i >= 1 and not self.is_valid_turn(self.coordinates[path[i - 1]], self.coordinates[current], self.coordinates[next_node]):
                return False
            visited.add(current)
        return len(visited) == self.n

    def fitness(self, path, distances, graph):
        if not self.is_valid_path(path, graph):
            return float('inf')
        length = sum(distances.get((path[i], path[i + 1]), float('inf')) for i in range(len(path) - 1))
        violations = 0
        for i in range(1, len(path) - 1):
            if not self.is_valid_turn(self.coordinates[path[i - 1]], self.coordinates[path[i]], self.coordinates[path[i + 1]]):
                violations += 1
        return self.alpha * length + self.beta * violations

    def select_parents(self, population, fitnesses):
        total_fitness = sum(1 / f for f in fitnesses if f != float('inf'))
        if total_fitness == 0:
            probs = [1 / len(fitnesses)] * len(fitnesses)
        else:
            probs = [(1 / f if f != float('inf') else 0) / total_fitness for f in fitnesses]
        parents = random.choices(population, weights=probs, k=2)
        return parents

    def crossover(self, parent1, parent2, graph):
        if random.random() > self.crossover_rate:
            return parent1[:], parent2[:]
        start, end = sorted(random.sample(range(1, self.n), 2))
        child1 = [None] * len(parent1)
        child2 = [None] * len(parent2)
        child1[0], child1[-1] = self.start, self.start
        child2[0], child2[-1] = self.start, self.start
        child1[start:end] = parent1[start:end]
        child2[start:end] = parent2[start:end]
        p2_nodes = [n for n in parent2[1:-1] if n not in child1[start:end]]
        p1_nodes = [n for n in parent1[1:-1] if n not in child2[start:end]]
        p2_idx, p1_idx = 0, 0
        for i in range(1, self.n):
            if child1[i] is None:
                if p2_idx < len(p2_nodes):
                    child1[i] = p2_nodes[p2_idx]
                    p2_idx += 1
                else:
                    child1[i] = random.choice([n for n in range(self.n) if n != self.start and n not in child1[:i]])
            if child2[i] is None:
                if p1_idx < len(p1_nodes):
                    child2[i] = p1_nodes[p1_idx]
                    p1_idx += 1
                else:
                    child2[i] = random.choice([n for n in range(self.n) if n != self.start and n not in child2[:i]])
        if self.is_valid_path(child1, graph) and self.is_valid_path(child2, graph):
            return child1, child2
        return parent1[:], parent2[:]

    def mutate(self, path, graph):
        if random.random() > self.mutation_rate:
            return path[:]
        i, j = random.sample(range(1, self.n), 2)
        mutated = path[:]
        mutated[i], mutated[j] = mutated[j], mutated[i]
        if self.is_valid_path(mutated, graph):
            return mutated
        return path[:]

    def ga_optimizer(self):
        graph, distances = self.create_graph()
        population = self.initialize_population(graph)
        best_path = None
        best_fitness = float('inf')
        for _ in range(self.max_gen):
            fitnesses = [self.fitness(path, distances, graph) for path in population]
            min_fitness = min(fitnesses)
            if min_fitness < best_fitness:
                best_fitness = min_fitness
                best_path = population[fitnesses.index(min_fitness)][:]
            new_population = []
            for _ in range(self.pop_size // 2):
                parent1, parent2 = self.select_parents(population, fitnesses)
                child1, child2 = self.crossover(parent1, parent2, graph)
                child1 = self.mutate(child1, graph)
                child2 = self.mutate(child2, graph)
                new_population.extend([child1, child2])
            population = new_population[:self.pop_size]
        best_length = sum(distances.get((best_path[i], best_path[i + 1]), float('inf')) for i in range(len(best_path) - 1))
        return best_path, best_length