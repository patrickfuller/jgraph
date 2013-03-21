from IPython.display import Javascript, display
import re
import os
import json_formatter
import force_directed_layout

# Load required assets on import
path = os.path.dirname(os.path.realpath(__file__))
js = {"script": "/js/graph_ipython.js", "three": "/js/three.min.js",
      "controls": "/js/TrackballControls.js", "toon": "/js/ShaderToon.js"}
for key, filename in js.items():
    with open(path + filename) as in_js:
        js[key] = in_js.read()

# This is the only way I found to use local copies of js libraries in IPython
js["script"] = js["three"] + js["controls"] + js["toon"] + js["script"]


def draw(data, size=(400, 225), toon=True):
    """Draws an interactive 3D visualization of the inputted graph.

    Arguments:
    data -- Either an adjacency list of tuples (ie. [(1,2),...]) or json
    size -- Dimensions of visualization, in pixels (default is (400, 225))
    toon -- Use a toon-shader postprocessor (default is True)

    Inputting an adjacency list into `data` results in a "default" graph type.
    For more customization, generate a json file using other methods before
    running the drawer.
    """

    # Guess the input format and handle accordingly
    if isinstance(data, list):
        js["graph"] = json_formatter.dumps(generate(data))
    elif isinstance(data, dict):
        js["graph"] = json_formatter.dumps(data)
    else:
        # Support both files and strings
        try:
            with open(data) as in_file:
                js["graph"] = in_file.read()
        except:
            js["graph"] = data

    # This stitches together js and json to create a runnable js string
    js["w"], js["h"] = [str(s) for s in size]
    js["toon"] = "true" if toon else "false"
    drawer = re.sub("#\(\w+\)", lambda m: js[m.group()[2:-1]], js["script"])

    # Execute compiled js and display the results in a div (see script for more)
    display(Javascript(data=drawer))


def generate(data, iterations=1000, force_strength=5.0, dampening=0.01,
             max_velocity=2.0, max_distance=50, is_3d=True):
    """Runs a force-directed algorithm on a graph, returning a data structure.

    Arguments:
    data -- An adjacency list of tuples (ie. [(1,2),...])
    iterations -- Number of FDL iterations to run in coordinate generation
    force_strength -- Strength of Coulomb and Hooke forces
                      (edit this to scale the distance between nodes)
    dampening -- Multiplier to reduce force applied to nodes
    max_velocity -- Maximum distance a node can move in one step
    max_distance -- The maximum distance considered for interactions
    is_3d -- Generates three-dimensional coordinates (default is True)

    Outputs a json-serializable Python object. To visualize, pass the output to
    `igraph.draw(...)`.
    """

    edges = [{"source": s, "target": t} for s, t in data]
    nodes = force_directed_layout.run(edges, iterations, force_strength,
                                      dampening, max_velocity, max_distance,
                                      is_3d)
    return {"edges": edges, "nodes": nodes}


def to_json(data):
    """Converts the output of `generate(...)` to formatted json.

    Floats are rounded to three decimals and positional vectors are printed on
    one line with some whitespace buffer.
    """
    return json_formatter.dumps(data)
