console.log("main.js loaded")
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';const renderer = new THREE.WebGLRenderer({ antialias: true});
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(4, 5, 11);
camera.lookAt(0, 1, 0); // Ensure the camera is looking at the target

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0; // Allow full upward rotation
controls.maxPolarAngle = Math.PI; // Allow full downward rotation
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();



scene.background = new THREE.Color(0x000000);

const spotLight = new THREE.SpotLight(0xffffff, 5, 100, 0.2, 0.5);
spotLight.position.set(10,20,10);
spotLight.castShadow = true; // Enable shadow casting
scene.add(spotLight);
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1); // Sky color, ground color, intensity
hemisphereLight.position.set(0, 20, 0);
scene.add(hemisphereLight);

const ambientLight = new THREE.AmbientLight(404040, 1); // Soft white light
scene.add(ambientLight);
// Add a Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright white light
directionalLight.position.set(5, 10, 5); // Position the light
directionalLight.castShadow = true; // Enable shadow casting
scene.add(directionalLight);

// Adjust the Spotlight
spotLight.intensity = 15; // Increase the intensity of the spotlight
const loader = new GLTFLoader().setPath('./public/skeleton/');

loader.load('scene.gltf', (gltf) => {
    const mesh = gltf.scene;
    mesh.position.set(0, -1, -1);
    mesh.scale.set(1.3, 1.3, 1.3);

    mesh.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Ensure emissive is set to allow hover highlighting
            child.material = new THREE.MeshStandardMaterial({
                color: child.material.color || 0xffffff,
                metalness: 0.5,
                roughness: 0.5,
                emissive: new THREE.Color(0x000000), // Add this line
                emissiveIntensity: 1
            });
        }
    });

    scene.add(mesh);
});


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    
}

animate();

console.log(controls);

renderer.domElement.addEventListener('mousedown', () => {
    console.log('Mouse down on canvas');
  });

// RAYCAST
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null; // Track the currently hovered object

// Add a mousemove event listener
document.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mousedown', onMouseDown);
function onMouseDown(event) {
    // Calculate normalized device coordinates (NDC)
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    // Set the raycaster from the camera and mouse coordinates
    raycaster.setFromCamera(mouse, camera);

    // Get intersections with objects in the scene
    const intersections = raycaster.intersectObjects(scene.children, true);

    if (intersections.length > 0) {
        const clickedObject = intersections[0].object;

        // Get the name of the clicked object, replace underscores with spaces
        let boneName = clickedObject.name || 'Unnamed Mesh';
        boneName = boneName.replace(/_/g, ' '); // Replace underscores with spaces

        // Output the name of the clicked mesh to the input box
        const inputBox = document.getElementById('mesh-name');
        inputBox.value = boneName; // Display the name or a default message

        // Add the fade-in animation class
        inputBox.classList.remove('fade-in'); // Remove the class if it already exists
        void inputBox.offsetWidth; // Trigger reflow to restart the animation
        inputBox.classList.add('fade-in'); // Add the class to trigger the animation
    }
}

// Hover logic with specific colors for named meshes
function onMouseMove(event) {
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersections = raycaster.intersectObjects(scene.children, true);

    if (intersections.length > 0) {
        const intersectedObject = intersections[0].object;

        if (hoveredObject !== intersectedObject) {
            if (hoveredObject && hoveredObject.material?.emissive) {
                hoveredObject.material.emissive.set(0x000000); // reset
            }

            hoveredObject = intersectedObject;
            if (hoveredObject.material?.emissive) {
                hoveredObject.material.emissive.set(0xff0000); // highlight red
            }
        }
    } else {
        if (hoveredObject && hoveredObject.material?.emissive) {
            hoveredObject.material.emissive.set(0x000000); // reset
            hoveredObject = null;
        }
    }
}
document.addEventListener('mousemove', onMouseMove);

// Make the textbox draggable
const textbox = document.getElementById('mesh-name');

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

textbox.addEventListener('mousedown', (event) => {
    isDragging = true;
    offsetX = event.clientX - textbox.offsetLeft;
    offsetY = event.clientY - textbox.offsetTop;
    textbox.style.cursor = 'grabbing'; // Change cursor to grabbing
});

document.addEventListener('mousemove', (event) => {
    if (isDragging) {
        textbox.style.left = `${event.clientX - offsetX}px`;
        textbox.style.top = `${event.clientY - offsetY}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    textbox.style.cursor = 'grab'; // Change cursor back to grab
});