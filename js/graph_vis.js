/**
 * 3D graph visualization, alpha implementation.
 *
 * Requires three.js.
 */

var camera, scene, renderer;
var light;
var fileReader;

var colors, materials;
var sphereGeometry, cylinderGeometry;
var nodes, edges;

var DEFAULT_NODE_COLOR = "0xaaaaaa";
var DEFAULT_EDGE_COLOR = "0x888888";
var NODE_SIZE = 2;
var EDGE_SIZE = NODE_SIZE / 8;

window.onload = function() {
    init();
    animate();
};

/**
 * Initializes the three.js scene.
 */
function init() {

    fileReader = new FileReader();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Sets a camera with (view angle, aspect, near, far) and moves up z
    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(70, aspect, 1, 3000);
    camera.position.z = 200;
    addControls();

    // Loads a primitive sphere for atoms (radius, segments, rings)
    sphereGeometry = new THREE.SphereGeometry(1, 32, 16);
    cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 32, 16, false);

    // This orients the cylinder primitive so THREE.lookAt() works properly
    vPreRotation = new THREE.Vector3(Math.PI / 2, Math.PI, 0);
    matrix = new THREE.Matrix4().setRotationFromEuler(vPreRotation);
    cylinderGeometry.applyMatrix(matrix);

    nodes = [];
    edges = [];
    materials = {};

    // Creates a light source
    light = new THREE.HemisphereLight(0xffffff, 1.0);
    light.position = camera.position;

    // Initializes a scene and appends objects to be drawn
    scene = new THREE.Scene();
    scene.add(camera);
    scene.add(light);

    window.addEventListener("resize", onWindowResize, false);

    // Set up the drag-and-drop listeners.
    var dropZone = document.getElementById("drop_zone");
    dropZone.addEventListener("dragover", onDragOver, false);
    dropZone.addEventListener("drop", onFileSelect, false);

    // Default graph for display
    $.getJSON("json/miserables.json", function(json) {
        drawGraph(json);
    });
}

/**
 * Contains parameters pertaining to camera rotating, zooming, and panning.
 */
function addControls() {
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 1;
    controls.zoomSpeed = 0.25;
    controls.panSpeed = 1;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.3;

    controls.minDistance = 1;
    controls.maxDistance = 100;

    controls.keys = [65, 83, 68]; // [ rotateKey, zoomKey, panKey ]
}

/**
 * Loads json files containing graphs and builds materials, if needed
 */
function updateMaterials(json) {

    // Make sure that every node + edge has a color property in lower case
    var node;
    for (var key in json.nodes) {
        node = json.nodes[key];
        node.color = node.hasOwnProperty("color")?
                     node.color.toLowerCase() : DEFAULT_NODE_COLOR;
        if(!materials.hasOwnProperty(node.color)) {
        var col = { color: parseInt(node.color, 16) };
            materials[node.color] = new THREE.MeshLambertMaterial(col);
        }
    }
    for (var i = 0; i < json.edges.length; i++) {
        var edge = json.edges[i];
        edge.color = edge.hasOwnProperty("color")?
                     edge.color.toLowerCase() : DEFAULT_EDGE_COLOR;
        if(!materials.hasOwnProperty(edge.color)) {
            var col = { color: parseInt(edge.color, 16) };
            materials[edge.color] = new THREE.MeshLambertMaterial(col);
        }
    }
    console.log(materials);
}

/**
 * Deletes any existing graphs.
 */
function clear() {
    for (var i = 0; i < nodes.length; i++) {
        scene.remove(nodes[i]);
    }
    nodes = [];
    for (var i = 0; i < edges.length; i++) {
        scene.remove(edges[i]);
    }
    edges = [];
}

/**
 * Draws a graph. Duh.
 */
function drawGraph(graph) {
    var mesh, material, node, edge, source, target;
    var mag;
    var vSource = new THREE.Vector3();
    var vTarget = new THREE.Vector3();
    var vCent = new THREE.Vector3();
    var vDiff = new THREE.Vector3();

    updateMaterials(graph);

    for (var key in graph.nodes) {
        node = graph.nodes[key];
        mesh = new THREE.Mesh(sphereGeometry, materials[node.color]);
        mesh.position.set(node.location[0], node.location[1], node.location[2]);
        mesh.scale.x = mesh.scale.y = mesh.scale.z = NODE_SIZE;
        scene.add(mesh);
        nodes.push(mesh);
    }

    for (var i = 0; i < graph.edges.length; i++) {
        var edge = graph.edges[i];
        source = graph.nodes[edge.source].location;
        target = graph.nodes[edge.target].location;
        vSource.set(source[0], source[1], source[2]);
        vTarget.set(target[0], target[1], target[2]);

        vCent.addVectors(vSource, vTarget).divideScalar(2);

        vDiff.subVectors(vTarget, vSource);
        mag = vDiff.length();

        mesh = new THREE.Mesh(cylinderGeometry, materials[edge.color]);
        mesh.position.set(vCent.x, vCent.y, vCent.z);
        mesh.lookAt(vTarget);
        mesh.scale.x = mesh.scale.y = EDGE_SIZE;
        mesh.scale.z = mag;

        scene.add(mesh);
        edges.push(mesh);
    }
}

/**
 * Fires when a file is dropped onto the load-files div
 */
function onFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files;
    fileReader.onload = (function(file) {
        return function(loaded) {
            clear();
            console.log(loaded.target.result);
            drawGraph($.parseJSON(loaded.target.result));
        };
    })(files[0]);
    fileReader.readAsText(files[0]);

    // TODO implement a sexy history thing.
    //document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

/**
 * Fires when the load-files div is being hovered
 */
function onDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "copy";
}

/**
 * Adjusts drawing surface when browser is resized
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Runs in a loop, updating scene as needed.
 */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

