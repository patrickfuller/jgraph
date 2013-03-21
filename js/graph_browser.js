var camera, scene, renderer;
var light, shader;
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

function arrayToVector(array) {
    return new THREE.Vector3(array[0], array[1], array[2]);
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
            materials[node.color] = makeMaterial(node.color);
        }
    }
    for (var i = 0; i < json.edges.length; i++) {
        var edge = json.edges[i];
        edge.color = edge.hasOwnProperty("color")?
                     edge.color.toLowerCase() : DEFAULT_EDGE_COLOR;
        if(!materials.hasOwnProperty(edge.color)) {
            materials[edge.color] = makeMaterial(edge.color);
        }
    }
}

/**
 * Makes a shader material from an input color and returns
 */
function makeMaterial(color) {
    var mat = new THREE.ShaderMaterial({
                  uniforms: THREE.UniformsUtils.clone(shader.uniforms),
                  vertexShader: shader.vertexShader,
                  fragmentShader: shader.fragmentShader});
    mat.uniforms.uDirLightPos.value.set(camera.position.z, camera.position.z,
                                        camera.position.z);
    var col = new THREE.Color(parseInt(color, 16));
    mat.uniforms.uAmbientLightColor.value = new THREE.Color(parseInt("0x222222", 16));
    mat.uniforms.uDirLightColor.value = col;
    mat.uniforms.uBaseColor.value = col;
    return mat;
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
    var mesh, material, node, edge, mag;
    var vSource, vTarget, vCent, vDiff;
    vCent = new THREE.Vector3();
    vDiff = new THREE.Vector3();

    updateMaterials(graph);

    for (var key in graph.nodes) {
        node = graph.nodes[key];
        mesh = new THREE.Mesh(sphereGeometry, materials[node.color]);
        mesh.position.copy(arrayToVector(node.location));
        mesh.scale.x = mesh.scale.y = mesh.scale.z = NODE_SIZE;
        scene.add(mesh);
        nodes.push(mesh);
    }

    for (var i = 0; i < graph.edges.length; i++) {
        edge = graph.edges[i];
        vSource = arrayToVector(graph.nodes[edge.source].location);
        vTarget = arrayToVector(graph.nodes[edge.target].location);

        vCent.addVectors(vSource, vTarget).divideScalar(2);
        vDiff.subVectors(vTarget, vSource);
        mag = vDiff.length();

        mesh = new THREE.Mesh(cylinderGeometry, materials[edge.color]);
        mesh.position.copy(vCent);
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
    shader = THREE.ShaderToon["toon2"];

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

