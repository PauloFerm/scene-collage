import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { LumaSplatsThree } from "@lumaai/luma-web";

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
camera.position.x = 0;
camera.position.y = 250;
camera.position.z = 220;

const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;

/**
 * Import Custom Model
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 4.1);
scene.add(ambientLight);

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

const toggleControls = () => {
  let newStatus = !transformControls.showX;
  transformControls.showX = newStatus;
  transformControls.showY = newStatus;
  transformControls.showZ = newStatus;

  const toggleDisplay = (id, status) => {
    document.getElementById(id).style.display = status ? "block" : "none";
  };

  toggleDisplay("logPosition", newStatus);
  toggleDisplay("logRotation", newStatus);
  toggleDisplay("logScale", newStatus);
  toggleDisplay("foot", newStatus);
};

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

    case "c":
      toggleControls();
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

document.getElementById("togglecontrols").onclick = toggleControls;

const collageUrl = "/models/onco_low.json";

fetch(collageUrl)
  .then((response) => response.json())
  .then((modelState) => {
    /**
     * Import Gaussian Splat Scene
     */
    const splat = new LumaSplatsThree({
      source: `https://lumalabs.ai/capture/${modelState.splat.url}`,
    });

    splat.rotateX(modelState.splat.rotation.x);
    splat.rotateY(modelState.splat.rotation.y);
    splat.rotateZ(modelState.splat.rotation.z);

    splat.scale.set(
      modelState.splat.scale.x,
      modelState.splat.scale.y,
      modelState.splat.scale.z
    );
    scene.add(splat);

    //    console.log("Model State", modelState);

    const mtlLoader = new MTLLoader()
      .setPath("/models/")
      .load(`${modelState.name}.mtl`, (materials) => {
        materials.preload();

        for (let materialName in materials.materials) {
          let material = materials.materials[materialName];
          material.transparent = false;
        }

        //console.log("Materials", materials.materials);

        const loader = new OBJLoader()
          .setMaterials(materials)
          .setPath("/models/")
          .load(`${modelState.name}.obj`, (modelObject) => {
            /**
             * Rotate model on world axis
             */
            modelObject.rotateOnAxis(
              new THREE.Vector3(1, 0, 0),
              modelState.cad.rotation.x
            );

            modelObject.rotateOnAxis(
              new THREE.Vector3(0, 1, 0),
              modelState.cad.rotation.y
            );

            modelObject.rotateOnAxis(
              new THREE.Vector3(0, 0, 1),
              modelState.cad.rotation.z
            );

            /**
             * Position model on world axis
             */
            modelObject.position.x = modelState.cad.position.x;
            modelObject.position.y = modelState.cad.position.y;
            modelObject.position.z = modelState.cad.position.z;

            /**
             * Scale model
             */
            modelObject.scale.set(
              modelState.cad.scale.x,
              modelState.cad.scale.y,
              modelState.cad.scale.z
            );

            /**
             * Add model to scene
             */
            scene.add(modelObject);

            /**
             * Attach transform controls to model
             */
            transformControls.attach(modelObject);
            transformControls.showX = false;
            transformControls.showY = false;
            transformControls.showZ = false;
            scene.add(transformControls);
          });

        console.log("Scene:", scene.children);
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

/**
 * Calculate angles between world axis and model
 * @param {THREE.Object3D} model - The 3D model to calculate angles for
 * @returns {Object} Object containing angles in degrees for each axis
 */
const calculateModelAngles = (model) => {
  // Get the model's rotation matrix
  const rotationMatrix = new THREE.Matrix4();
  model.updateMatrix();
  rotationMatrix.extractRotation(model.matrix);

  // Convert rotation matrix to Euler angles
  const euler = new THREE.Euler();
  euler.setFromRotationMatrix(rotationMatrix);

  return euler;
};

const updateModelState = () => {
  let model = scene.children[2];
  let modelAngles = calculateModelAngles(model);

  const updateText = (id, tag, value) => {
    document.getElementById(id).innerHTML = `${tag}: ${value.toFixed(2)}`;
  };

  updateText("rotationX", "X", modelAngles.x);
  updateText("rotationY", "Y", modelAngles.y);
  updateText("rotationZ", "Z", modelAngles.z);

  updateText("positionX", "X", model.position.x);
  updateText("positionY", "Y", model.position.y);
  updateText("positionZ", "Z", model.position.z);

  updateText("scaleX", "X", model.scale.x);
  updateText("scaleY", "Y", model.scale.y);
  updateText("scaleZ", "Z", model.scale.z);
};

const reportFrame = 50;
let frameCount = 1;

const loop = () => {
  render();
  if (frameCount % reportFrame === 0) {
    updateModelState();
  }
  frameCount++;
  window.requestAnimationFrame(loop);
};

loop();
