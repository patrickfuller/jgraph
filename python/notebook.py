from IPython.display import HTML, display
import os
import uuid
from . import force_directed_layout, json_formatter

filename = 'igraph.min.js'
file_path = os.path.normpath(os.path.dirname(__file__))
local_path = os.path.join('nbextensions', filename)
remote_path = ('https://rawgit.com/patrickfuller/igraph/master/'
               'js/build/igraph.min.js')


def draw(data, size=(600, 400), node_size=2.0, edge_size=0.25,
         default_node_color=0x5bc0de, default_edge_color=0xaaaaaa, z=100,
         shader='basic', optimize=True, directed=True, display_html=True):
    """Draws an interactive 3D visualization of the inputted graph.

    Args:
        data: Either an adjacency list of tuples (ie. [(1,2),...]) or object
        size: (Optional) Dimensions of visualization, in pixels
        node_size: (Optional) Defaults to 2.0
        edge_size: (Optional) Defaults to 0.25
        default_node_color: (Optional) If loading data without specified
            'color' properties, this will be used. Default is 0x5bc0de
        default_edge_color: (Optional) If loading data without specified
            'color' properties, this will be used. Default is 0xaaaaaa
        z: (Optional) Starting z position of the camera. Default is 100.
        shader: (Optional) Specifies shading algorithm to use. Can be 'toon',
            'basic', 'phong', or 'lambert'. Default is 'basic'.
        optimize: (Optional) Runs a force-directed layout algorithm on the
            graph. Default True.
        directed: (Optional) Includes arrows on edges to indicate direction.
            Default True.
        display_html: If True (default), embed the html in a IPython display.
            If False, return the html as a string.

    Inputting an adjacency list into `data` results in a 'default' graph type.
    For more customization, use the more expressive object format.
    """
    # Catch errors on string-based input before getting js involved
    shader_options = ['toon', 'basic', 'phong', 'lambert']
    if shader not in shader_options:
        raise Exception('Invalid shader! Please use one of: ' +
                        ', '.join(shader_options))

    # Try using IPython >=2.0 to install js locally
    try:
        from IPython.html.nbextensions import install_nbextension
        install_nbextension([os.path.join(file_path,
                             'js/build', filename)], verbose=0)
    except:
        pass

    if isinstance(default_edge_color, int):
        default_edge_color = hex(default_edge_color)
    if isinstance(default_node_color, int):
        default_node_color = hex(default_node_color)

    # Guess the input format and handle accordingly
    if isinstance(data, list):
        graph = json_formatter.dumps(generate(data, iterations=1))
    elif isinstance(data, dict):
        # Convert color hex to string for json handling
        for node_key in data['nodes']:
            node = data['nodes'][node_key]
            if 'color' in node and isinstance(node['color'], int):
                node['color'] = hex(node['color'])
        for edge in data['edges']:
            if 'color' in edge and isinstance(edge['color'], int):
                edge['color'] = hex(edge['color'])
        graph = json_formatter.dumps(data)
    else:
        # Support both files and strings
        try:
            with open(data) as in_file:
                graph = in_file.read()
        except:
            graph = data

    div_id = uuid.uuid4()
    html = '''<div id="graph-%(id)s"></div>
           <script type="text/javascript">
           require.config({baseUrl: '/',
                             paths: {igraph: ['%(local)s', '%(remote)s']}});
           require(['igraph'], function () {
               var $d = $('#graph-%(id)s');
               $d.width(%(w)d); $d.height(%(h)d);
               $d.igraph = jQuery.extend({}, igraph);
               $d.igraph.create($d, {nodeSize: %(node_size)f,
                                     edgeSize: %(edge_size)f,
                                     defaultNodeColor: '%(node_color)s',
                                     defaultEdgeColor: '%(edge_color)s',
                                     shader: '%(shader)s',
                                     z: %(z)d,
                                     runOptimization: %(optimize)s,
                                     directed: %(directed)s});
               $d.igraph.draw(%(graph)s);

               $d.resizable({
                   aspectRatio: %(w)d / %(h)d,
                   resize: function (evt, ui) {
                       $d.igraph.renderer.setSize(ui.size.width,
                                                  ui.size.height);
                   }
               });
           });
           </script>''' % dict(id=div_id, local=local_path[:-3],
                               remote=remote_path[:-3], w=size[0], h=size[1],
                               node_size=node_size, edge_size=edge_size,
                               node_color=default_node_color,
                               edge_color=default_edge_color, shader=shader,
                               z=z, graph=graph,
                               optimize='true' if optimize else 'false',
                               directed='true' if directed else 'false')

    # Execute js and display the results in a div (see script for more)
    if display_html:
        display(HTML(html))
    else:
        return html


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

    edges = [{'source': s, 'target': t} for s, t in data]
    nodes = force_directed_layout.run(edges, iterations, force_strength,
                                      dampening, max_velocity, max_distance,
                                      is_3d)
    return {'edges': edges, 'nodes': nodes}


def to_json(data):
    """Converts the output of `generate(...)` to formatted json.

    Args:
        data: The data structure outputted by `generate()`

    Floats are rounded to three decimals and positional vectors are printed on
    one line with some whitespace buffer.
    """
    return json_formatter.dumps(data)
