"""
Generates network coordinates using a force-directed layout.
"""

from random import uniform
from math import sqrt
from itertools import combinations, repeat


def run(edges, iterations=1000, force_strength=5.0, dampening=0.01,
        max_velocity=2.0, max_distance=50, is_3d=True):
    """Runs a force-directed-layout algorithm on the input graph.

    iterations - Number of FDL iterations to run in coordinate generation
    force_strength - Strength of Coulomb and Hooke forces
                     (edit this to scale the distance between nodes)
    dampening - Multiplier to reduce force applied to nodes
    max_velocity - Maximum distance a node can move in one step
    max_distance - The maximum distance considered for interactions
    """

    # Get a list of node ids from the edge data
    nodes = set(e['source'] for e in edges) | set(e['target'] for e in edges)

    # Convert to a data-storing object and initialize some values
    d = 3 if is_3d else 2
    nodes = {n: {'velocity': [0.0] * d, 'force': [0.0] * d} for n in nodes}

    # Repeat n times (is there a more Pythonic way to do this?)
    for _ in repeat(None, iterations):

        # Add in Coulomb-esque node-node repulsive forces
        for node1, node2 in combinations(nodes.values(), 2):
            _coulomb(node1, node2, force_strength, max_distance)

        # And Hooke-esque edge spring forces
        for edge in edges:
            _hooke(nodes[edge['source']], nodes[edge['target']],
                   force_strength * edge.get('size', 1), max_distance)

        # Move by resultant force
        for node in nodes.values():
            # Constrain the force to the bounds specified by input parameter
            force = [_constrain(dampening * f, -max_velocity, max_velocity)
                     for f in node['force']]
            # Update velocities and reset force
            node['velocity'] = [v + dv
                                for v, dv in zip(node['velocity'], force)]
            node['force'] = [0] * d

    # Clean and return
    for node in nodes.values():
        del node['force']
        node['location'] = node['velocity']
        del node['velocity']
        # Even if it's 2D, let's specify three dimensions
        if not is_3d:
            node['location'] += [0.0]
    return nodes


def _coulomb(n1, n2, k, r):
    """Calculates Coulomb forces and updates node data."""
    # Get relevant positional data
    delta = [x2 - x1 for x1, x2 in zip(n1['velocity'], n2['velocity'])]
    distance = sqrt(sum(d ** 2 for d in delta))

    # If the deltas are too small, use random values to keep things moving
    if distance < 0.1:
        delta = [uniform(0.1, 0.2) for _ in repeat(None, 3)]
        distance = sqrt(sum(d ** 2 for d in delta))

    # If the distance isn't huge (ie. Coulomb is negligible), calculate
    if distance < r:
        force = (k / distance) ** 2
        n1['force'] = [f - force * d for f, d in zip(n1['force'], delta)]
        n2['force'] = [f + force * d for f, d in zip(n2['force'], delta)]


def _hooke(n1, n2, k, r):
    """Calculates Hooke spring forces and updates node data."""
    # Get relevant positional data
    delta = [x2 - x1 for x1, x2 in zip(n1['velocity'], n2['velocity'])]
    distance = sqrt(sum(d ** 2 for d in delta))

    # If the deltas are too small, use random values to keep things moving
    if distance < 0.1:
        delta = [uniform(0.1, 0.2) for _ in repeat(None, 3)]
        distance = sqrt(sum(d ** 2 for d in delta))

    # Truncate distance so as to not have crazy springiness
    distance = min(distance, r)

    # Calculate Hooke force and update nodes
    force = (distance ** 2 - k ** 2) / (distance * k)
    n1['force'] = [f + force * d for f, d in zip(n1['force'], delta)]
    n2['force'] = [f - force * d for f, d in zip(n2['force'], delta)]


def _constrain(value, min_value, max_value):
    """Constrains a value to the inputted range."""
    return max(min_value, min(value, max_value))


if __name__ == '__main__':
    import sys
    import json
    import json_formatter

    # See if input is a file
    try:
        with open(sys.argv[-1]) as in_file:
            edges = json.load(in_file)
    except IOError:
        edges = json.loads(sys.argv[-1])

    # Convert to internal representation
    edges = [{'source': str(s), 'target': str(t)} for s, t in edges]

    # Handle additional args
    kwargs = {'force_strength': 5.0, 'is_3d': True}
    for i, arg in enumerate(sys.argv):
        if arg == '--force-strength':
            kwargs['force_strength'] = float(sys.argv[i + 1])
        elif arg == '--2D':
            kwargs['is_3d'] = False

    # Generate nodes
    nodes = run(edges, **kwargs)

    # Convert to json and print
    print(json_formatter.dumps({'edges': edges, 'nodes': nodes}))
