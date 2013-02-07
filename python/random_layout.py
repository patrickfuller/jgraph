#!/usr/bin/env python
"""
Generates network coordinates using a brute-force approach.
"""
from random import random, randint, sample
import re


def run(edges, edge_length=20, separation=10, density=0, is_concentric=False,
        is_3d=True):
    """Finds non-colliding coordinates for network nodes through brute force.

    Parameters
    edges - [ { "source": node_id, "target": node_id }, ... ]
    edge_length - The length of an edge connecting two nodes
    separation - The minimum distance between any two nodes
    density - If positive, attempts to compress the network spherically
    is_concentric - If True, root nodes are in the center of the graph
    is_3d - If True, generates three-dimensional coordinates (2D otherwise)

    Returns a dictionary of { node_id: {"location": (...)}, ... }
    """

    # Get root node(s) from edges. Roots are targets that are never sources.
    roots = set(e["target"] for e in edges) - set(e["source"] for e in edges)

    # If there are no roots, arbitrarily choose a node
    if len(roots) == 0:
        roots = set([edges[0]["source"]])

    # Manually place all root nodes.
    # Note: this is not ideal for the case of multiple roots
    nodes = {root: {"location": [separation * i] + [0] * (2 if is_3d else 1)}
             for i, root in enumerate(roots)}

    # A little heuristic to confine the network
    sphere_threshold = len(edges) / (density if density > 0 else 1E-6)

    # Iterative process - Keep going until every node is positioned
    all_nodes_located = False
    while not all_nodes_located:
        all_nodes_located = True

        # Make a pass at attempting to locate all nodes
        for edge in edges:

            # Skip if already positioned
            if edge["source"] in nodes.keys():
                continue

            # If target is not yet placed, keep iterating
            if edge["target"] not in nodes.keys():
                all_nodes_located = False
                continue

            # Brute-force approach: Randomly locate node, check for collision
            target_location = nodes[edge["target"]]["location"]
            colliding = True
            number_of_attempts = 0
            while colliding:
                colliding = False

                # If the number of attempts is getting crazy, error
                if number_of_attempts > 100000:
                    raise Exception(("Cannot place all nodes! Consider either "
                                     "increasing `edge_length` or decreasing "
                                     "`separation`."))

                # Propose a random location relative to target
                location = [edge_length * (-1.0 + 2.0 * random()) + c
                            for c in target_location]

                # This provides a directional bias that pushes the root node to
                # the outside of a network.
                if not is_concentric:
                    location[0] = edge_length * random() + target_location[0]

                # Check if colliding
                for node in nodes.values():
                    if (magnitude(location, node["location"]) <= separation or
                            magnitude(location, [0] * 3) > sphere_threshold):
                        colliding = True
                        number_of_attempts += 1
                        break

            # When non-colliding coordinate is found, save
            nodes[edge["source"]] = {"location": location}

    # Even if it's 2D, let's specify three dimensions
    if not is_3d:
        for node in nodes.values():
            node["location"] += [0]

    return nodes


def magnitude(a, b):
    """Returns the magnitude between two vectors."""
    return sum([(c2 - c1) ** 2 for c1, c2 in zip(a, b)]) ** 0.5


if __name__ == "__main__":
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
    edges = [{"source": str(s), "target": str(t)} for s, t in edges]

    # Handle additional args
    kwargs = {"edge_length": 20, "separation": 5, "density": 0,
              "is_concentric": False, "is_3d": True}
    for i, arg in enumerate(sys.argv):
        if arg == "--edge-length":
            kwargs["edge_length"] = float(sys.argv[i + 1])
        elif arg == "--separation":
            kwargs["separation"] = float(sys.argv[i + 1])
        elif arg == "--density":
            kwargs["density"] = float(sys.argv[i + 1])
        elif arg == "--concentric":
            kwargs["is_concentric"] = True
        elif arg == "--2D":
            kwargs["is_3d"] = False

    # Generate nodes
    nodes = run(edges, **kwargs)

    # Convert to json and print
    print json_formatter.dumps({"edges": edges, "nodes": nodes})
