graph-vis
=========

A 3D network layout and visualization tool written with three.js.

A running version of this script can be found [here](http://www.patrick-fuller.com/graph-vis/).
By default, it loads `miserables.json`, but you can drag and drop to load `pinwheel.json`,
located [here](http://www.patrick-fuller.com/graph-vis/json/pinwheel.json).

Usage
-----

This viewer takes input JSON graph data structures. As an example, consider:

```
{
    "edges": [
        {
            "source": 1, 
            "target": 2
        }, 
        {
            "source": 2, 
            "target": 3
        }, 
        {
            "source": 3, 
            "target": 4
        }
    ], 
    "nodes": {
        "1": {
            "location": [ 9.339, -17.667, -2.138 ]
        }, 
        "2": {
            "location": [ 8.877, -7.235, -10.665 ]
        }, 
        "3": {
            "location": [ 3.765, -0.434, -19.326 ],
            "color": "0xff0000"
        }, 
        "4": {
            "location": [ 0, 0, 0 ]
        }
    }
}
```

Nodes and edges can be colored by specifying a `"color"` field. If not specified,
the visualizer defaults to some grayscale colors.

To generate networks from adjacency lists, use the scripts in the `python/` directory.

```bash
python force_directed_layout.py --force-strength 10 --2D "[[1,2],[2,3],[3,4]]"
```

 * `--force-strength` determines the separation between nodes
 * `--2D` confines the network layout to two dimensions

```bash
python random_layout.py --edge-length 15 --separation 3 --density 60 --concentric --2D "[[1,2],[2,3],[3,4]]"
```

 * `--edge-length` is the maximum length of a network edge
 * `--separation` is the minimum distance between any two nodes
 * `--density` attempts to compact the nodes spherically if non-zero
 * `--concentric` places the root node at the center of the network
 * `--2D` confines the network layout to two dimensions

Save these outputs to files, optionally edit to add in colors, and drag the files into the viewer.
