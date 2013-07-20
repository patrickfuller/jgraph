from IPython.display import Javascript, display
import os
import json_formatter
import force_directed_layout

# Load required assets on import (IPython comes with jQuery)
PATH = os.path.normpath(os.path.dirname(__file__))
LIB = ["lib/three.min.js", "lib/TrackballControls.js",
       "lib/ShaderToon.js", "igraph.js"]

# This is the only way I found to use local copies of js libraries in IPython
lib_script = ""
for filename in LIB:
    with open(os.path.join(PATH, filename)) as in_js:
        lib_script += in_js.read()

def draw(data, size=(400, 225), node_size=2.0, edge_size=0.25,
         default_node_color="0xaaaaaa", default_edge_color="0x777777", z=20):
    """Draws an interactive 3D visualization of the inputted graph.

    Args:
        data: Either an adjacency list of tuples (ie. [(1,2),...]) or json
        size: (Optional) Dimensions of visualization, in pixels
        node_size: (Optional) Defaults to 2.0
        edge_size: (Optional) Defaults to 0.25
        default_node_color: (Optional) If loading data without specified
            "color" properties, this will be used. Default is "0xaaaaaa"
        default_edge_color: (Optional) If loading data without specified
            "color" properties, this will be used. Default is "0x222222"
        z: (Optional) Starting z position of the camera. Default is 20

    Inputting an adjacency list into `data` results in a "default" graph type.
    For more customization, generate a json file using other methods before
    running the drawer.
    """

    # Guess the input format and handle accordingly
    if isinstance(data, list):
        graph = json_formatter.dumps(generate(data))
    elif isinstance(data, dict):
        graph = json_formatter.dumps(data)
    else:
        # Support both files and strings
        try:
            with open(data) as in_file:
                graph = in_file.read()
        except:
            graph = data

    # This calls igraph and uses some IPython magic to get everything linked
    script = ("var $d = $('<div/>').attr('id', 'graph_' + utils.uuid());"
              "$d.width(%d); $d.height(%d);"
              "igraph.create($d, {nodeSize: %f, edgeSize: %f,"
              "               defaultNodeColor: '%s',"
              "               defaultEdgeColor: '%s'});"
              "igraph.draw(%s);"
              "container.show();"
              "element.append($d);" % (size[0], size[1], node_size, edge_size,
              default_node_color, default_edge_color, graph))

    # Execute js and display the results in a div (see script for more)
    display(Javascript(data=lib_script + script))


def generate(data, iterations=1000, force_strength=5.0, dampening=0.01,
             max_velocity=2.0, max_distance=50, is_3d=True):
    """Runs a force-directed algorithm on a graph, returning a data structure.

    Args:
        data: An adjacency list of tuples (ie. [(1,2),...])
        iterations: (Optional) Number of FDL iterations to run in coordinate
            generation
        force_strength: (Optional) Strength of Coulomb and Hooke forces
            (edit this to scale the distance between nodes)
        dampening: (Optional) Multiplier to reduce force applied to nodes
        max_velocity: (Optional) Maximum distance a node can move in one step
        max_distance: (Optional) The maximum inter-node distance considered
        is_3d: (Optional) Generates three-dimensional coordinates

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

    Args:
        data: The data structure outputted by `generate()`

    Floats are rounded to three decimals and positional vectors are printed on
    one line with some whitespace buffer.
    """
    return json_formatter.dumps(data)
