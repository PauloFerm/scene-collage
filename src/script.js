import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { LumaSplatsThree } from "@lumaai/luma-web";

//import * as dat from "lil-gui";

// THREE.ColorManagement.enabled = true;

/**
 * GUI
 */
//const gui = new dat.GUI();

/**
 * DOM
 */
const canvas = document.querySelector("canvas.webgl");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const aspectRatio = sizes.width / sizes.height;

/**
 * Scene camera and controls
 */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, aspectRatio, 1, 1500);
camera.position.x = 40;
camera.position.y = 100;
camera.position.z = 180;

const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;

/**
 * Import Gaussian Splat Scene
 */
const splat = new LumaSplatsThree({
  source: "https://lumalabs.ai/capture/b318ae30-21fc-42f3-9561-4851ea7da8f9",
});

splat.rotateY(-Math.PI * 0.5);
splat.scale.set(100, 100, 100);
scene.add(splat);
console.log("Splats", splat);

/**
 * Import Custom Model
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 4.1);
scene.add(ambientLight);
//scene.fog = new THREE.Fog(0xcccccc, 500, 800);

/**
 * Render and Loop
 */

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener("dragging-changed", (event) => {
  orbitControls.enabled = !event.value;
});

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "t":
      transformControls.setMode("translate");
      break;

    case "r":
      transformControls.setMode("rotate");
      break;

    case "s":
      transformControls.setMode("scale");
      break;
  }
});

document.getElementById("translate").onclick = () => {
  transformControls.setMode("translate");
};

document.getElementById("rotate").onclick = () => {
  transformControls.setMode("rotate");
};

document.getElementById("scale").onclick = () => {
  transformControls.setMode("scale");
};

/**
 * Model Parameters
 */
const parameters = {
  rotation: {
    x: 0,
    y: Math.PI * 0.2,
    z: 0,
  },
  scale: {
    x: 0.7,
    y: 0.55,
    z: 0.7,
  },
  position: {
    x: -10,
    y: 25,
    z: -30,
  },
};

const mtlLoader = new MTLLoader()
  .setPath("/models/")
  .load("PokeCenter.mtl", (materials) => {
    materials.preload();

    for (let materialName in materials.materials) {
      let material = materials.materials[materialName];
      material.transparent = false;
    }

    console.log("Materials", materials.materials);

    const loader = new OBJLoader()
      .setMaterials(materials)
      .setPath("/models/")
      .load("PokeCenter.obj", (model) => {
        //model.rotateY(Math.PI * 0.2);
        model.setRotationFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          parameters.rotation.y
        );

        model.position.x = parameters.position.x;
        model.position.y = parameters.position.y;
        model.position.z = parameters.position.z;

        model.scale.set(
          parameters.scale.x,
          parameters.scale.y,
          parameters.scale.z
        );

        scene.add(model);

        // gui
        //   .add(model.position, "x")
        //   .name("Position X")
        //   .min(-40)
        //   .max(40)
        //   .step(1);
        // gui
        //   .add(model.position, "y")
        //   .name("Position Y")
        //   .min(-40)
        //   .max(40)
        //   .step(1);
        // gui
        //   .add(model.position, "z")
        //   .name("Position Z")
        //   .min(-40)
        //   .max(40)
        //   .step(1);

        // const setRotationGUI = (axis, name, vector) => {
        //   gui
        //     .add(parameters.rotation, axis)
        //     .name(name)
        //     .min(-Math.PI)
        //     .max(Math.PI)
        //     .step(0.005)
        //     .onChange((value) => {
        //       model.setRotationFromAxisAngle(vector, value);
        //     });
        // };

        // setRotationGUI("y", "Rotation", new THREE.Vector3(0, 1, 0));

        // gui.add(model.scale, "x").name("Scale X").min(-0.1).max(1).step(0.01);
        // gui.add(model.scale, "y").name("Scale Y").min(-0.1).max(1).step(0.01);
        // gui.add(model.scale, "z").name("Scale Z").min(-0.1).max(1).step(0.01);

        console.log(model);

        transformControls.attach(model);
        scene.add(transformControls);
      });
  });

renderer.render(scene, camera);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
});

const render = () => {
  orbitControls.update();
  renderer.render(scene, camera);
  renderer.setSize(sizes.width, sizes.height, true);
};

const loop = () => {
  render();
  window.requestAnimationFrame(loop);
};

loop();
