/*global THREE, $, jQuery, window*/
"use strict";

var igraph = {

    // Creates a new instance of igraph
    create: function (selector, options) {
        var $s, vPreRotation, matrix, self;
        $s = $(selector);
        self = this;
        options = options || {};

        this.nodeSize = options.hasOwnProperty("nodeSize") ? options.nodeSize : 2.0;
        this.edgeSize = options.hasOwnProperty("edgeSize") ? options.edgeSize : 0.25;
        this.defaultNodeColor = options.hasOwnProperty("defaultNodeColor") ?
                options.defaultNodeColor : "0xaaaaaa";
        this.defaultEdgeColor = options.hasOwnProperty("defaultEdgeColor") ?
                options.defaultEdgeColor : "0x777777";
        this.shader = options.hasOwnProperty("shader") ? options.shader : THREE.ShaderToon.toon2;

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize($s.width(), $s.height());
        $s.append(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(70, $s.width() / $s.height());
        this.camera.position.z = options.hasOwnProperty("z") ? options.z : 100;

        this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);

        this.sphereGeometry = new THREE.SphereGeometry(1, 16, 12);
        this.cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 3, false);

        // This orients the cylinder primitive so THREE.lookAt() works properly
        vPreRotation = new THREE.Vector3(Math.PI / 2, Math.PI, 0);
        matrix = new THREE.Matrix4().makeRotationFromEuler(vPreRotation);
        this.cylinderGeometry.applyMatrix(matrix);

        this.light = new THREE.HemisphereLight(0xffffff, 1.0);
        this.light.position = this.camera.position;
        this.light.rotation = this.camera.rotation;

        this.nodes = [];
        this.edges = [];
        this.materials = {};
        this.materials[this.defaultNodeColor] = this.makeMaterial(this.defaultNodeColor);
        this.materials[this.defaultEdgeColor] = this.makeMaterial(this.defaultEdgeColor);

        this.scene = new THREE.Scene();
        this.scene.add(this.camera);
        this.scene.add(this.light);

        $(window).resize(function () {
            self.renderer.setSize($s.width(), $s.height());
            self.camera.aspect = $s.width() / $s.height();
            self.camera.updateProjectionMatrix();
        });

        this.animate();
    },

    // Draws webgl meshes from input javascript object
    draw: function (graph) {
        var vectors, material, mesh, mag, self;
        self = this;

        // Instantiate a bunch of properties for geometric calculations
        vectors = {};
        $.each(["source", "target", "cent", "diff"], function (i, value) {
            vectors[value] = new THREE.Vector3();
        });

        // Draws nodes and saves references
        $.each(graph.nodes, function (k, node) {
            if (node.hasOwnProperty("color")) {
                node.color = node.color.toLowerCase();
                if (!self.materials.hasOwnProperty(node.color)) {
                    self.materials[node.color] = self.makeMaterial(node.color);
                }
            }
            material = self.materials[node.hasOwnProperty("color") ?
                    node.color : self.defaultNodeColor];
            mesh = new THREE.Mesh(self.sphereGeometry, material);
            mesh.position.fromArray(node.location);
            mesh.scale.x = mesh.scale.y = mesh.scale.z = self.nodeSize;
            self.scene.add(mesh);
            self.nodes.push(mesh);
        });

        // Edges require some basic vector math
        $.each(graph.edges, function (i, edge) {
            if (edge.hasOwnProperty("color")) {
                edge.color = edge.color.toLowerCase();
                if (!self.materials.hasOwnProperty(edge.color)) {
                    self.materials[edge.color] = self.makeMaterial(edge.color);
                }
            }
            vectors.source.fromArray(graph.nodes[edge.source.toString()].location);
            vectors.target.fromArray(graph.nodes[edge.target.toString()].location);
            vectors.cent.addVectors(vectors.source, vectors.target).divideScalar(2);
            mag = vectors.diff.subVectors(vectors.target, vectors.source).length();

            material = self.materials[edge.hasOwnProperty("color") ?
                    edge.color : self.defaultEdgeColor];
            mesh = new THREE.Mesh(self.cylinderGeometry, material);
            mesh.position.copy(vectors.cent);
            mesh.lookAt(vectors.target);
            mesh.scale.x = mesh.scale.y = self.edgeSize;
            mesh.scale.z = mag;
            self.scene.add(mesh);
            self.edges.push(mesh);
        });
    },

    // Deletes the existing graph
    clear: function () {
        var self = this;
        $.each(this.nodes.concat(this.edges), function (i, value) {
            self.scene.remove(value);
        });
        this.nodes = [];
        this.edges = [];
    },

    // Makes a toon-shaded material
    makeMaterial: function (color) {
        var material = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.clone(this.shader.uniforms),
                vertexShader: this.shader.vertexShader,
                fragmentShader: this.shader.fragmentShader
            });
        material.uniforms.uDirLightPos.value.set(this.camera.position.z,
                           this.camera.position.z, this.camera.position.z);
        color = new THREE.Color(parseInt(color, 16));
        material.uniforms.uDirLightColor.value = color;
        material.uniforms.uBaseColor.value = color;
        return material;
    },

    // Runs the main window animation in an infinite loop
    animate: function () {
        var self = this;
        window.requestAnimationFrame(function () {
            return self.animate();
        });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
};
