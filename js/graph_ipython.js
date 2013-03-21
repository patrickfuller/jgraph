var camera, scene, renderer, controls, light, shader;
var colors, materials, sphereGeometry, cylinderGeometry;

var DEFAULT_NODE_COLOR = "0x8888ee";
var DEFAULT_EDGE_COLOR = "0x888888";
var NODE_SIZE = 2;
var EDGE_SIZE = NODE_SIZE / 8;

init();
animate();

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
    controls.maxDistance = 400;

    controls.keys = [65, 83, 68];
}

function arrayToVector(array) {
    return new THREE.Vector3(array[0], array[1], array[2]);
}

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
    }
}

function updateMaterials(json) {

    // Make sure that every node + edge has a color property in lower case
    var node, col;
    for (var key in json.nodes) {
        node = json.nodes[key];
        node.color = node.hasOwnProperty("color")?
                     node.color.toLowerCase() : DEFAULT_NODE_COLOR;
        if(!materials.hasOwnProperty(node.color)) {
            col = { color: parseInt(node.color, 16) };
            materials[node.color] = #(toon)? makeToonMaterial(col.color) :
                                    new THREE.MeshLambertMaterial(col);
        }
    }
    for (var i = 0; i < json.edges.length; i++) {
        var edge = json.edges[i];
        edge.color = edge.hasOwnProperty("color")?
                     edge.color.toLowerCase() : DEFAULT_EDGE_COLOR;
        if(!materials.hasOwnProperty(edge.color)) {
            col = { color: parseInt(edge.color, 16) };
            materials[edge.color] = #(toon)? makeToonMaterial(col.color) :
                                    new THREE.MeshLambertMaterial(col);
        }
    }
}

function makeToonMaterial(color) {
    var mat = new THREE.ShaderMaterial({
                  uniforms: THREE.UniformsUtils.clone(shader.uniforms),
                  vertexShader: shader.vertexShader,
                  fragmentShader: shader.fragmentShader});
    mat.uniforms.uDirLightPos.value.set(camera.position.z, camera.position.z,
                                        camera.position.z);
    mat.uniforms.uAmbientLightColor.value = new THREE.Color(parseInt("0x222222", 16));
    var col = new THREE.Color(color);
    mat.uniforms.uDirLightColor.value = col;
    mat.uniforms.uBaseColor.value = col;
    return mat;
}

function init() {

    // Sets a camera with (view angle, aspect, near, far) and moves up z
    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(40, #(w) / #(h), 1, 3000);
    camera.position.z = 20;

    // Loads a primitive sphere for atoms (radius, segments, rings)
    sphereGeometry = new THREE.SphereGeometry(1, 16, 12);
    cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 16, 12, false);

    // This orients the cylinder primitive so THREE.lookAt() works properly
    var vPreRotation = new THREE.Vector3(Math.PI / 2, Math.PI, 0);
    var matrix = new THREE.Matrix4().setRotationFromEuler(vPreRotation);
    cylinderGeometry.applyMatrix(matrix);

    materials = {};

    // Creates a light source
    light = new THREE.HemisphereLight(0xffffff, 1.0);
    light.position = camera.position;
    shader = THREE.ShaderToon["toon2"];

    // Initializes a scene and appends objects to be drawn
    scene = new THREE.Scene();
    scene.add(camera);
    scene.add(light);

    drawGraph( #(graph) );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( #(w), #(h) );
    addControls();

    // Use IPython handles to create a div below the current line
    container.show();
    var div = $("<div/>").attr("id", "graph_" + utils.uuid());
    div.html(renderer.domElement);
    element.append(div);
}

/**
 * Runs in a loop, updating scene as needed.
 */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

