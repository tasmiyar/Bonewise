import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Add OrbitControls for mouse interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Variables for the quiz system
let randomMesh = null; // To store the randomly selected mesh
let meshes = []; // Array to store all meshes
let score = 0; // User's score
let currentMeshIndex = 0; // Index of the current mesh
// List of mesh names to be tested
const targetMeshNames = [
    'anatomical_neck',
    'surgical_neck',
    'greater_tubercle 1',
    'lesser_tubercle',
    'head',
    'deltoid_tuberosity 1',
    'trochlea',
    'capitulum',
    'medial_epicondyle',
    'lateral_epicondyle',
    'intertubercular_sulcus',
    'olecranon_fossa',
    'radial_fossa 2',
    'coronoid_fossa 2',
].map(name => name.replace(/_/g, ' ')); // Normalize names by replacing underscores with spaces

// Load the Humerus GLTF model
const loader = new GLTFLoader();
loader.setPath('./public/upper/'); // Ensure the path starts with './'
loader.load('humerus.gltf', (gltf) => {
    const model = gltf.scene;

    // Traverse the model to find all meshes
    model.traverse((child) => {
        if (child.isMesh) {
            const normalizedName = child.name.toLowerCase().replace(/_/g, ' ');
            console.log(`Found mesh: ${normalizedName}`); // Log all mesh names
            if (targetMeshNames.includes(normalizedName)) {
                meshes.push(child); // Add the mesh to the array if it matches the target names
                child.castShadow = true;
                child.receiveShadow = true;
                console.log(`Added to quiz: ${normalizedName}`);
            } else {
                console.log(`Skipped: ${normalizedName}`);
            }
        }
    });

    scene.add(model);

    // Center the model in the scene
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y = 0;
    model.position.x = 0;
    
    // 🔀 Shuffle the mesh array
    shuffleArray(meshes);
    
    // Start the quiz
    selectNextMesh();
    
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


// Function to calculate Levenshtein distance (edit distance)
function calculateLevenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, // Deletion
                matrix[i][j - 1] + 1, // Insertion
                matrix[i - 1][j - 1] + cost // Substitution
            );
        }
    }

    return matrix[a.length][b.length];
}

// Function to select the next random mesh
function selectNextMesh() {
    if (currentMeshIndex >= meshes.length) {
        if (randomMesh) {
            randomMesh.material.emissive.set(0x000000); // Remove highlight
        }

        alert(`Quiz complete! You scored ${score} out of ${meshes.length}.`);

        // Hide input box and show restart button
        inputBox.style.display = 'none';
        restartButton.style.display = 'block';

        // Show mistakes after quiz completion
        showMistakes();

        return;
    }

    // Reset the previous mesh's material
    if (randomMesh) {
        randomMesh.material.emissive.set(0x000000); // Remove previous glow
    }

    // Select the next mesh
    randomMesh = meshes[currentMeshIndex];

    // Ensure the mesh has its own material
    if (!randomMesh.material.emissive) {
        randomMesh.material = randomMesh.material.clone();
    }

    randomMesh.material.emissive = new THREE.Color(0xffd700); // Highlight it
    currentMeshIndex++;

    updateScoreBox();
}



// Create a list to store mistakes
let mistakes = [];


// Set up the camera position
camera.position.set(0, 1, 5);
controls.update();

// Create a restart button
const restartButton = document.createElement('button');
restartButton.textContent = 'Restart Quiz';
restartButton.style.position = 'absolute';
restartButton.style.top = '30%';
restartButton.style.left = '70%';
restartButton.style.transform = 'translate(-50%, -50%)';
restartButton.style.padding = '10px 20px';
restartButton.style.fontSize = '16px';
restartButton.style.border = 'none';
restartButton.style.borderRadius = '5px';
restartButton.style.backgroundColor = '#efefef';
restartButton.style.color = 'black';
restartButton.backgroundColor = 'rgba(0, 0, 0, 0.8)';

restartButton.style.cursor = 'pointer';
restartButton.style.display = 'none'; // Hidden until quiz ends
document.body.appendChild(restartButton);


// Create an input box for the quiz
const inputBox = document.createElement('input');
inputBox.type = 'text';
inputBox.placeholder = 'Name the yellow marking';
inputBox.style.position = 'absolute';
inputBox.style.top = '50%'; // Center vertically
inputBox.style.left = '70%'; // Center horizontally
inputBox.style.transform = 'translate(-50%, -50%)'; // Adjust for perfect centering
inputBox.style.padding = '10px';
inputBox.style.fontSize = '16px';
inputBox.style.border = '1px solid #ccc';
inputBox.style.borderRadius = '5px';
document.body.appendChild(inputBox);

// Create a feedback box
const feedbackBox = document.createElement('div');
feedbackBox.style.position = 'absolute';
feedbackBox.style.top = '60%';
feedbackBox.style.left = '70%';
feedbackBox.style.transform = 'translate(-50%, -50%)';
feedbackBox.style.padding = '10px';
feedbackBox.style.fontSize = '16px';
feedbackBox.style.color = 'white';
feedbackBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
feedbackBox.style.borderRadius = '5px';
feedbackBox.style.transition = 'opacity 1s ease';
feedbackBox.style.opacity = '0'; // Start fully transparent
feedbackBox.style.display = 'none'; // Hidden initially
document.body.appendChild(feedbackBox);


// Create a score box
const scoreBox = document.createElement('div');
scoreBox.style.position = 'absolute';
scoreBox.style.top = '40%'; // Center vertically
scoreBox.style.left = '70%'; // Center horizontally
scoreBox.style.transform = 'translate(-50%, -50%)'; // Adjust for perfect centering
scoreBox.style.padding = '10px';
scoreBox.style.fontSize = '20px';
scoreBox.style.color = 'white';
scoreBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
scoreBox.style.borderRadius = '5px';
scoreBox.textContent = `Score: ${score} / ${meshes.length}`;
document.body.appendChild(scoreBox);

// Create a mistakes list box
const mistakesBox = document.createElement('div');
mistakesBox.style.position = 'absolute';
mistakesBox.style.top = '46%';
mistakesBox.style.left = '20%';
mistakesBox.style.transform = 'translate(-50%, -50%)';
mistakesBox.style.padding = '10px';
mistakesBox.style.fontSize = '16px';
mistakesBox.style.color = 'white';
mistakesBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
mistakesBox.style.borderRadius = '5px';
mistakesBox.style.width = '300px'; // Adjust size
mistakesBox.style.maxHeight = '500px';
mistakesBox.style.overflowY = 'auto'; // Add scrolling
mistakesBox.style.display = 'none'; // Initially hidden
document.body.appendChild(mistakesBox);

function showMistakes() {
    mistakesBox.style.display = 'block';
    mistakesBox.innerHTML = '<h3>Incorrect Answers:</h3>';
    mistakes.forEach((mistake, index) => {
        mistakesBox.innerHTML += `
            <p>${index + 1}. You said: "<span style="color: red;">${mistake.userInput}</span>"</p>
            <p><span style="color: white;">Correct answer:</span> <span style="color: green; font-weight: bold;">${mistake.correctAnswer}</span></p>
            <br />`; // Adds a line space between the two parts
    });
}




// Function to update the score box
function updateScoreBox() {
    scoreBox.textContent = `Score: ${score} / ${meshes.length}`;
}

function restartQuiz() {
    // Reset variables
    currentMeshIndex = 0;
    score = 0;

    // Reset any highlighted mesh
    if (randomMesh) {
        randomMesh.material.emissive.set(0x000000);
        randomMesh = null;
    }

    // Shuffle and restart quiz
    shuffleArray(meshes);
    updateScoreBox();
    selectNextMesh();

    // Show input box again
    inputBox.style.display = 'block';

    // Hide the restart button
    restartButton.style.display = 'none';

    // Hide the mistakes box when restarting
    mistakesBox.style.display = 'none';
}

/// Handle input submission
inputBox.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && randomMesh) {
        const userInput = inputBox.value.trim().toLowerCase();
        const correctName = randomMesh.name.toLowerCase().replace(/_/g, ' '); // Normalize the correct name

        // Calculate the Levenshtein distance
        const distance = calculateLevenshteinDistance(userInput, correctName);

        if (distance <= 3) {
            feedbackBox.textContent = 'Correct!';
            feedbackBox.style.backgroundColor = 'green';
            score++; // Increment the score
        } else {
            const sanitizedCorrectName = correctName.replace(/[0-9]/g, '').trim();
            feedbackBox.textContent = `Incorrect! The correct name is: ${sanitizedCorrectName}`;
            feedbackBox.style.backgroundColor = 'red';
        
            // Add to mistakes list
            mistakes.push({
                userInput: userInput,
                correctAnswer: sanitizedCorrectName
            });
        }

        feedbackBox.style.display = 'block';  // Show the feedback box
        feedbackBox.style.opacity = '1';      // Fade-in effect

        // Make the feedback visible for 3 seconds
        setTimeout(() => {
            feedbackBox.style.opacity = '0';  // Start fading out
            setTimeout(() => {
                feedbackBox.style.display = 'none';  // Hide after fading out
            }, 1000);  // Wait for the fade-out to complete (1 second)
        }, 3000);  // Keep the box visible for 3 seconds

        inputBox.value = ''; // Clear the input box

        // Move to the next mesh
        selectNextMesh();
    }
});

restartButton.addEventListener('click', restartQuiz);


// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});