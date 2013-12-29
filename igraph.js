/*global THREE, $, jQuery, window, setTimeout*/
"use strict";

var igraph = {

    // Creates a new instance of igraph
    create: function (selector, options) {
        var vPreRotation, matrix, self;
        this.$s = $(selector);
        self = this;
        options = options || {};

        this.directed = options.hasOwnProperty("directed") ? options.directed : true;
        this.nodeSize = options.hasOwnProperty("nodeSize") ? options.nodeSize : 2.0;
        this.edgeSize = options.hasOwnProperty("edgeSize") ? options.edgeSize : 0.25;
        this.arrowSize = options.hasOwnProperty("arrowSize") ? options.arrowSize : this.edgeSize * 4;
        this.defaultNodeColor = options.hasOwnProperty("defaultNodeColor") ?
                options.defaultNodeColor : "0xaaaaaa";
        this.defaultEdgeColor = options.hasOwnProperty("defaultEdgeColor") ?
                options.defaultEdgeColor : "0x777777";
        this.shader = options.hasOwnProperty("shader") ? options.shader : THREE.ShaderToon.toon2;
        this.runOptimization = options.hasOwnProperty("runOptimization") ? options.runOptimization : true;

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(this.$s.width(), this.$s.height());
        this.$s.append(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(70, this.$s.width() / this.$s.height());
        this.camera.position.z = options.hasOwnProperty("z") ? options.z : 100;

        this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);

        this.sphereGeometry = new THREE.SphereGeometry(this.nodeSize, 16, 12);
        this.cylinderGeometry = new THREE.CylinderGeometry(this.edgeSize, this.edgeSize, 1, 32, 3, false);
        this.coneGeometry = new THREE.CylinderGeometry(this.edgeSize, this.arrowSize, 2 * this.arrowSize, 32, 3, false);

        // This orients the cylinder primitive so THREE.lookAt() works properly
        vPreRotation = new THREE.Vector3(Math.PI / 2, Math.PI, 0);
        matrix = new THREE.Matrix4().makeRotationFromEuler(vPreRotation);
        this.cylinderGeometry.applyMatrix(matrix);
        this.coneGeometry.applyMatrix(matrix);

        this.light = new THREE.HemisphereLight(0xffffff, 1.0);
        this.light.position = this.camera.position;
        this.light.rotation = this.camera.rotation;

        this.nodes = [];
        this.edges = [];
        this.arrows = [];
        this.materials = {};
        this.materials[this.defaultNodeColor] = this.makeMaterial(this.defaultNodeColor);
        this.materials[this.defaultEdgeColor] = this.makeMaterial(this.defaultEdgeColor);

        this.scene = new THREE.Scene();
        this.scene.add(this.camera);
        this.scene.add(this.light);

        $(window).resize(function () {
            self.renderer.setSize(self.$s.width(), self.$s.height());
            self.camera.aspect = self.$s.width() / self.$s.height();
            self.camera.updateProjectionMatrix();
        });

        this.animate();
    },

    // Draws webgl meshes from input javascript object
    draw: function (graph) {
        var material, mesh, arrow, mag, self, map, n1, n2;
        self = this;
        map = {};

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
            mesh.name = k;
            mesh.position.fromArray(node.hasOwnProperty("location") ?
                                    node.location : [0, 0, 0]);
            if (node.hasOwnProperty("size")) {
                mesh.scale.set(node.size, node.size, node.size);
            }
            map[k] = self.nodes.length;
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
            n1 = self.nodes[map[edge.source.toString()]];
            n2 = self.nodes[map[edge.target.toString()]];
            material = self.materials[edge.hasOwnProperty("color") ?
                    edge.color : self.defaultEdgeColor];
            mesh = new THREE.Mesh(self.cylinderGeometry, material);
            mesh.position.addVectors(n1.position, n2.position).divideScalar(2.0);
            mesh.lookAt(n2.position);
            mag = n2.position.distanceTo(n1.position);
            mesh.scale.z = mag;

            // Save array-index references to nodes, mapping from object structure
            mesh.source = map[edge.source.toString()];
            mesh.target = map[edge.target.toString()];
            self.scene.add(mesh);
            self.edges.push(mesh);

            // If directed, add on arrows
            if (self.directed) {
                arrow = new THREE.Mesh(self.coneGeometry, material);
                arrow.position = mesh.position;
                arrow.lookAt(n2.position);
                self.scene.add(arrow);
                self.arrows.push(arrow);
            }
        });

        if (this.runOptimization) {
            this.optimize();
        }
    },

    // Fires a user-specified callback (function (node) {}) on node click
    onNodeClick: function (callback) {
        var self = this;
        this.projector = new THREE.Projector();
        this.$s.click(function (event) {
            var vector, raycaster, intersects, i;
            vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
            self.projector.unprojectVector(vector, self.camera);
            raycaster = new THREE.Raycaster(self.camera.position,
                vector.sub(self.camera.position).normalize());
            intersects = raycaster.intersectObjects(self.nodes);
            if (intersects.length !== 0) {
                callback(intersects[0].object);
            }
        });
    },

    // Fires onEnter and onExit callbacks (function node() {}) on each node
    onNodeHover: function (onEnter, onExit) {
        var self = this;
        this.projector = new THREE.Projector();
        this.$s.mousemove(function (event) {
            var vector, raycaster, intersects, i;
            vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
            self.projector.unprojectVector(vector, self.camera);
            raycaster = new THREE.Raycaster(self.camera.position,
                vector.sub(self.camera.position).normalize());
            intersects = raycaster.intersectObjects(self.nodes);
            // Move from node to empty
            if (intersects.length === 0) {
                if (this.selected !== undefined) {
                    onExit(this.selected);
                    this.selected = undefined;
                }
                return;
            }
            // Move from empty to node
            if (this.selected === undefined) {
                this.selected = intersects[0].object;
                onEnter(this.selected);
            // Move between nodes
            } else {
                if (this.selected !== intersects[0].object) {
                    onExit(this.selected);
                    this.selected = intersects[0].object;
                    onEnter(this.selected);
                }
            }
        });
    },

    // Deletes the existing graph
    clear: function () {
        var self = this;
        $.each(this.nodes.concat(this.edges).concat(this.arrows), function (i, value) {
            self.scene.remove(value);
        });
        this.nodes = [];
        this.edges = [];
        this.arrows = [];
    },

    // Makes a custom-shaded material
    makeMaterial: function (color) {
        if (typeof color === "string" || color instanceof String) {
            color = parseInt(color, 16);
        }
        var material = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.clone(this.shader.uniforms),
                vertexShader: this.shader.vertexShader,
                fragmentShader: this.shader.fragmentShader
            });
        material.uniforms.uDirLightPos.value.set(this.camera.position.z,
                           this.camera.position.z, this.camera.position.z);
        color = new THREE.Color(color);
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
    },

    // Runs a force-directed layout algorithm on the currently displayed graph
    optimize: function (options) {
        var iterations, forceStrength, dampening, maxVelocity, maxDistance,
            iterate, self, l, i, j, k, delta, mag, n1, n2, e, a;
        self = this;

        options = options || {};
        iterations = options.hasOwnProperty("iterations") ? options.iterations : 10000;
        forceStrength = options.hasOwnProperty("forceStrength") ? options.forceStrength : 10.0;
        dampening = 0.01;
        maxVelocity = 2.0;
        maxDistance = 50;
        delta = new THREE.Vector3();

        for (i = 0; i < self.nodes.length; i += 1) {
            self.nodes[i].force = new THREE.Vector3();
        }

        iterate = function () {
            dampening -= 0.01 / iterations;

            // Add in Coulomb-esque node-node repulsive forces
            for (j = 0; j < self.nodes.length; j += 1) {
                for (k = 0; k < self.nodes.length; k += 1) {
                    if (j === k) {
                        continue;
                    }
                    n1 = self.nodes[j];
                    n2 = self.nodes[k];

                    delta.subVectors(n2.position, n1.position);
                    mag = delta.length();
                    if (mag < 0.1) {
                        delta.set(Math.random(), Math.random(), Math.random())
                             .multiplyScalar(0.1).addScalar(0.1);
                        mag = delta.length();
                    }
                    if (mag < maxDistance) {
                        delta.multiplyScalar(forceStrength * forceStrength / (mag * mag));
                        n1.force.sub(delta.clone().multiplyScalar(n2.scale.x));
                        n2.force.add(delta.clone().multiplyScalar(n1.scale.x));
                    }
                }
            }

            // Add Hooke-esque edge spring forces
            for (j = 0; j < self.edges.length; j += 1) {
                n1 = self.nodes[self.edges[j].source];
                n2 = self.nodes[self.edges[j].target];

                delta.subVectors(n2.position, n1.position);
                mag = delta.length();
                if (mag < 0.1) {
                    delta.set(THREE.Math.randFloat(0.1, 0.2),
                              THREE.Math.randFloat(0.1, 0.2),
                              THREE.Math.randFloat(0.1, 0.2));
                    mag = delta.length();
                }
                mag = Math.min(mag, maxDistance);
                delta.multiplyScalar((mag * mag - forceStrength * forceStrength) / (mag * forceStrength));
                n1.force.add(delta.clone().multiplyScalar(n2.scale.x));
                n2.force.sub(delta.clone().multiplyScalar(n1.scale.x));
            }

            // Move by resultant force
            for (j = 0; j < self.nodes.length; j += 1) {
                n1 = self.nodes[j];
                n1.force.multiplyScalar(dampening);
                n1.force.setX(THREE.Math.clamp(n1.force.x, -maxVelocity, maxVelocity));
                n1.force.setY(THREE.Math.clamp(n1.force.y, -maxVelocity, maxVelocity));
                n1.force.setZ(THREE.Math.clamp(n1.force.z, -maxVelocity, maxVelocity));

                n1.position.add(n1.force);
                n1.force.set(0, 0, 0);
            }
            for (j = 0; j < self.edges.length; j += 1) {
                e = self.edges[j];
                n1 = self.nodes[e.source];
                n2 = self.nodes[e.target];
                e.position.addVectors(n1.position, n2.position).divideScalar(2.0);
                e.lookAt(n2.position);
                e.scale.z = n2.position.distanceTo(n1.position);

                if (self.directed) {
                    a = self.arrows[j];
                    a.position = e.position;
                    a.lookAt(n2.position);
                }
            }
        };

        for (i = 0; i < iterations; i += 1) {
            setTimeout(iterate, 0);
        }
    }
};
