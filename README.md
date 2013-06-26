igraph
======

An interactive 3D network layout and visualization tool for the IPython notebook
and [browsers](http://www.patrick-fuller.com/toon-graph-vis/).

![](http://www.patrick-fuller.com/wp-content/uploads/2013/02/toon-graph.png)

######For publication-quality renderings of 3D graphs, check out the [blender-graphs](https://github.com/patrickfuller/blender-graphs) project.

Usage
=====

###IPython notebook

Open a new notebook with `ipython notebook` and make sure that the `igraph`
directory is either in the directory you started the notebook or your
PYTHONPATH. You can test the setup by typing:

```python
import igraph
igraph.draw([(1, 2), (2, 3), (3, 4), (4, 1), (4, 5), (5, 2)])
```

into a notebook cell. You should get the output:

![](http://www.patrick-fuller.com/wp-content/uploads/2013/03/pinwheel_example.png)

You can use this in conjunction with other code for educational purposes. For
example, consider the generation of a binary tree:

![](http://www.patrick-fuller.com/wp-content/uploads/2013/03/btree_600.png)

In this case, the size of the render area was doubled to better view the entire
graph.

###Full Browser

A version of the browser can be found at http://www.patrick-fuller.com/toon-graph-vis/.
To start your own local version, cd to the `igraph` directory and start a
server with:

```bash
python -m SimpleHTTPServer
```

Navigate a browser to http://localhost:8000/index.html, and you're done. This
site allows for loading graphs via a simple file drag-and-drop interface. The
input takes json files, which are explained below.

###Graph File Format

The viewers take input json graph data structures. As an example, consider:

```
{
    "edges": [
        { "source": "1", "target": "2" },
        { "source": "2", "target": "3" },
        { "source": "3", "target": "4" }
    ],
    "nodes": {
        "1": { "location": [ -3.290, -6.258, -8.930 ] },
        "2": { "location": [ -1.115, -2.167, -3.103 ] },
        "3": { "location": [ 1.188, 2.173, 3.096 ], "color": "0xff0000" },
        "4": { "location": [ 3.348, 6.252, 8.937 ] }
    }
}
```

Nodes and edges can be colored by specifying a `"color"` field. If not specified,
the visualizer defaults to more boring colors.

In IPython, you can generate and edit graphs before drawing. For example,

![](http://www.patrick-fuller.com/wp-content/uploads/2013/03/colored_pinwheel_600.png)

For people who enjoy command-line tools, there are also argv hooks on
`force_directed_layout.py`.
