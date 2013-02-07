graph-vis
=========

A 3D network layout and visualization tool written with three.js.

A running version of this script can be found [here](http://www.patrick-fuller.com/graph-vis/).
By default, it loads `miserables.json`, but you can drag and drop to load `pinwheel.json`,
located [here](http://www.patrick-fuller.com/graph-vis/json/pinwheel.json).

Usage
-----

This viewer takes input JSON graph data structures. As an example, consider `pinwheel.json`:

```
{
    "edges": [
        {
            "source": "1",
            "target": "2"
        },
        {
            "source": "2",
            "target": "3"
        },
        {
            "source": "3",
            "target": "4"
        },
        {
            "source": "4",
            "target": "1"
        },
        {
            "source": "2",
            "target": "5"
        },
        {
            "source": "5",
            "target": "4"
        }
    ],
    "nodes": {
        "1": {
            "location": [ -5.898, -2.287, 0.116 ],
            "color": "0xff0000"
        },
        "2": {
            "location": [ 1.317, -3.395, -0.326 ],
            "color": "0x00ff00"
        },
        "3": {
            "location": [ 2.695, 1.615, -5.472 ],
            "color": "0x0000ff"
        },
        "4": {
            "location": [ -1.303, 3.395, 0.388 ],
            "color": "0xff00ff"
        },
        "5": {
            "location": [ 3.223, 0.672, 5.446 ],
            "color": "0x00ffff"
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

Save these outputs to files, and drag the files into the viewer.
