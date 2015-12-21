jgraph
======

An embeddable webGL graph visualization library.
http://patrickfuller.github.io/jgraph/

Examples
========

 * [IPython notebook](http://patrickfuller.github.io/jgraph/examples/ipython.html)
 * [les misérables](http://patrickfuller.github.io/jgraph/examples/miserables.html)
 * [github connections](http://patrickfuller.github.io/jgraph/examples/github.html)

IPython
=======

The IPython notebook is an open-source tool poised to replace MATLAB in many
applications. As a scientist of sorts, I'm all about it. Therefore, I made
handles to use jgraph with the notebook. Install through pip:

```
pip install jgraph
```

Open a new notebook and test the setup by typing:

```python
import jgraph
jgraph.draw([(1, 2), (2, 3), (3, 4), (4, 1), (4, 5), (5, 2)])
```

into a notebook cell. You should get a paddlewheel graph as an output. You can
use this in conjunction with other code for educational purposes (try generating
a red-black tree!). There are three commands and some optional parameters to
check out. Read the docstrings and check out the [associated
example](http://patrickfuller.github.io/jgraph/examples/ipython.html) for more.

Javascript
==========

You can install through [npm](https://www.npmjs.com/):

```
npm install jgraph
```

Once installed, you can use with:

```javascript
jgraph.create('my-selector');
jgraph.draw(myGraph);
```

where `'my-selector'` is where you want to place jgraph, and `myGraph` is a
javascript object. See below for more on the object structure, or just check out
the included example. The `jgraph.create()` method takes a few optional
parameters, specifying the sizes and colors of nodes, as well as force-directed
optimization.

```javascript
options = {
    directed: true, // Toggles edge arrows
    nodeSize: 2.0, // Default node size
    edgeSize: 0.25, // Edge connection diameter
    arrowSize: 1.0, // If drawn, edge arrow size
    defaultNodeColor: 0xaaaaaa, // Color for nodes without a "color" property
    defaultEdgeColor: 0x777777, // Color for edges without a "color" property
    shader: "toon", // three.js shader to use, can be "toon", "basic", "phong", or "lambert"
    runOptimization: true // Runs a force-directed-layout algorithm on the graph
};
```

Graph Data Format
=================

jgraph takes input graph data structures as plain objects. Here's the most
boring graph in the world:

```javascript
{
    nodes: {
        jane: { },
        bob: { },
        mike: { },
        sally: { }
    },
    edges: [
        { source: "jane", target: "bob" },
        { source: "bob", target: "mike" },
        { source: "mike", target: "sally" }
    ]
}
```

Nodes require no information outside of their keys. However, there are useful
optional parameters that can be specified.

```javascript
{
    color: 0xffffff, // Color for this node
    size: 1.0, // Scaling factor for this node's size
    location: [0.0, 0.0, 0.0] // Starting location of node. Useful for pre-rendering.
}
```

By default, the algorithm runs a force-directed layout on the graph. When
enabled, the "location" field is optional. However, for larger graphs, you will
want to disable this feature and pre-render the locations. Use the associated
Python library (`jgraph.generate`) to do so.
