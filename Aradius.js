import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
let isModelDragging = false;
let modelGroup = null; // Will hold the full model for dragging
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Drag on XZ plane
const dragPoint = new THREE.Vector3();


// Add lighting
const spotLight = new THREE.SpotLight(0xffffff, 2, 40, 0.2, 0.5); // Reduced intensity
spotLight.position.set(10, 20, 10);
spotLight.castShadow = true; // Enable shadow casting
scene.add(spotLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5); // Reduced intensity
hemisphereLight.position.set(0, 20, 0);
scene.add(hemisphereLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.2); // Reduced intensity
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Reduced intensity
directionalLight.position.set(5, 10, 5); // Position the light
directionalLight.castShadow = true; // Enable shadow casting
scene.add(directionalLight);

// Adjust the Spotlight
spotLight.intensity = 1.5; // Further reduced intensity

// Add OrbitControls for mouse interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth rotation
controls.dampingFactor = 0.05;

// Create a text box to display the mesh name
const meshNameBox = document.createElement('div');
meshNameBox.style.position = 'absolute';
meshNameBox.style.top = '50%'; // Center vertically
meshNameBox.style.left = '70%'; // Move the text box more to the right
meshNameBox.style.transform = 'translate(-50%, -50%)'; // Adjust for perfect centering
meshNameBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
meshNameBox.style.color = 'white';
meshNameBox.style.padding = '10px 20px';
meshNameBox.style.border = '1px solid white'; // Add a 1px border
meshNameBox.style.borderRadius = '5px';
meshNameBox.style.fontSize = '16px';
meshNameBox.style.fontFamily = 'Arial, sans-serif';
meshNameBox.style.textAlign = 'center'; // Center text inside the box
meshNameBox.style.opacity = '0'; // Start with invisible
meshNameBox.style.transition = 'opacity 0.5s ease'; // Add fade-in and fade-out transition
document.body.appendChild(meshNameBox);

// Load the Humerus GLTF model
const loader = new GLTFLoader();
loader.setPath('./public/upper/'); // Ensure the path starts with './'
loader.load('radius.gltf', (gltf) => {
    modelGroup = new THREE.Group();
    const model = gltf.scene;

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    modelGroup.add(model);
    scene.add(modelGroup);

    // Center the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y = 0;
    model.rotation.x = Math.PI
});


// Set up the camera position
camera.position.set(0, 1, 5); // Adjust the camera position
controls.update();

// Add raycaster for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with objects in the scene
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;

        // Replace underscores with spaces in the mesh name and remove numbers
        const meshName = clickedMesh.name.replace(/_/g, ' ').replace(/\d+/g, '') || 'Unnamed Mesh';

        // Reset opacity to trigger fade-in animation
        meshNameBox.style.opacity = '0'; // Reset opacity
        setTimeout(() => {
            // Display the mesh name in the text box
            meshNameBox.textContent = `${meshName}`;
            meshNameBox.style.opacity = '1'; // Fade in the text box
        }, 200); // Small delay to ensure the fade-in animation is triggered
    }
});


window.addEventListener('mousedown', (event) => {
    if (!modelGroup) return;

    const mouseCoords = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
    };
    mouse.set(mouseCoords.x, mouseCoords.y);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(modelGroup, true);

    if (intersects.length > 0) {
        isModelDragging = true;
        controls.enabled = false;
    }
});

window.addEventListener('mousemove', (event) => {
    if (!isModelDragging || !modelGroup) return;

    const mouseCoords = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
    };
    mouse.set(mouseCoords.x, mouseCoords.y);

    raycaster.setFromCamera(mouse, camera);

    if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
        modelGroup.position.x = dragPoint.x;
        modelGroup.position.z = dragPoint.z;
    }
});

window.addEventListener('mouseup', () => {
    if (isModelDragging) {
        isModelDragging = false;
        controls.enabled = true;
    }
});


// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});