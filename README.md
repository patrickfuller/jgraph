igraph
======

An interactive 3D graph visualizer for modern browsers. Check out the demo
[here](http://www.patrick-fuller.com/igraph/example/).

For publication-quality renderings of 3D graphs, check out the [blender-graphs](https://github.com/patrickfuller/blender-graphs) project.

![](http://imgur.com/98C5eoJ.png)

Usage
=====

```
igraph.create('my-selector');
igraph.draw(myGraph);
```

where `'my-selector'` is where you want to place igraph, and `myGraph` is
an object. See below for more on the object structure, or just check out the
included example.

The `igraph.create()` method takes a few optional parameters, specifying the
sizes and colors of nodes. Read the source for more.

IPython support
===============

The IPython notebook is an open-source tool poised to replace MATLAB in many
applications. As a scientist (of sorts), I'm all about it. Therefore, I made
handles to use igraph with the notebook.

Open a new notebook with `ipython notebook` and make sure that the `igraph`
directory is either in the directory you started the notebook or your
PYTHONPATH. You can test the setup by typing:

```python
import igraph
igraph.draw([(1, 2), (2, 3), (3, 4), (4, 1), (4, 5), (5, 2)])
```

into a notebook cell. You should get a paddlewheel graph as an output.

You can use this in conjunction with other code for educational purposes. Try
generating a red-black tree!

There are three commands and some optional parameters to check out. Read the
docstrings for more.

Graph Data Format
=================

The viewers take input graph data structures as javascript objects. As an
example, consider:

```
{
    "nodes": {
        "jane": { "location": [ -3.290, -6.258, -8.930 ] },
        "bob": { "location": [ -1.115, -2.167, -3.103 ], "color": "0x0000ff" },
        "mike": { "location": [ 1.188, 2.173, 3.096 ], "color": "0xff0000" },
        "sally": { "location": [ 3.348, 6.252, 8.937 ] }
    },
    "edges": [
        { "source": "jane", "target": "bob" },
        { "source": "bob", "target": "mike" },
        { "source": "mike", "target": "sally" }
    ]
}
```

Nodes and edges can be colored by specifying a `"color"` field. If not specified,
the visualizer defaults to grayscale (this behavior can be changed).
