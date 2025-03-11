import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Game class
class RacingGame {
    constructor() {
        // Initialize properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.car = null;
        this.ground = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        // Game state
        this.gameState = {
            speed: 0,
            maxSpeed: 50,
            acceleration: 0.2,
            deceleration: 0.1,
            brakeForce: 0.4,
            turnSpeed: 0.03,
            time: 0,
            isPlaying: false
        };
        
        // Controls state
        this.inputState = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        // Initialize the game
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 700);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, -10);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Add lights
        this.addLights();
        
        // Create ground
        this.createGround();
        
        // Create car
        this.createCar();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Start the game loop
        this.gameLoop();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }
    
    createGround() {
        // Create a simple ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1e7744,  // Grass green
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.ground = ground;
        this.scene.add(this.ground);
    }
    
    createCar() {
        // Create a simple car using primitive shapes
        const carGroup = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,  // Red
            roughness: 0.2,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        carGroup.add(body);
        
        // Car top/cabin
        const topGeometry = new THREE.BoxGeometry(1.5, 0.5, 2);
        const topMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,  // Dark gray
            roughness: 0.2,
            metalness: 0.5
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 1;
        top.position.z = -0.5;
        top.castShadow = true;
        carGroup.add(top);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111,  // Black
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Front wheels
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheel.position.set(-1, 0.4, -1.2);
        frontLeftWheel.castShadow = true;
        carGroup.add(frontLeftWheel);
        
        const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheel.position.set(1, 0.4, -1.2);
        frontRightWheel.castShadow = true;
        carGroup.add(frontRightWheel);
        
        // Rear wheels
        const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rearLeftWheel.rotation.z = Math.PI / 2;
        rearLeftWheel.position.set(-1, 0.4, 1.2);
        rearLeftWheel.castShadow = true;
        carGroup.add(rearLeftWheel);
        
        const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rearRightWheel.rotation.z = Math.PI / 2;
        rearRightWheel.position.set(1, 0.4, 1.2);
        rearRightWheel.castShadow = true;
        carGroup.add(rearRightWheel);
        
        // Headlights
        const headlightGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.1);
        const headlightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
        });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.6, 0.6, -2);
        carGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.6, 0.6, -2);
        carGroup.add(rightHeadlight);
        
        // Position the car
        carGroup.position.set(0, 0, 0);
        carGroup.rotation.y = 0;
        
        this.car = carGroup;
        this.scene.add(this.car);
        
        // Set up follow camera
        this.setupCamera();
    }
    
    setupCamera() {
        // Create a camera that follows the car
        this.camera.position.set(0, 5, -10);
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(event) {
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.inputState.forward = true;
                break;
            case 's':
            case 'arrowdown':
                this.inputState.backward = true;
                break;
            case 'a':
            case 'arrowleft':
                this.inputState.left = true;
                break;
            case 'd':
            case 'arrowright':
                this.inputState.right = true;
                break;
            case 'r':
                this.resetCar();
                break;
        }
    }
    
    handleKeyUp(event) {
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.inputState.forward = false;
                break;
            case 's':
            case 'arrowdown':
                this.inputState.backward = false;
                break;
            case 'a':
            case 'arrowleft':
                this.inputState.left = false;
                break;
            case 'd':
            case 'arrowright':
                this.inputState.right = false;
                break;
        }
    }
    
    resetCar() {
        // Reset car position and rotation
        this.car.position.set(0, 0, 0);
        this.car.rotation.y = 0;
        this.gameState.speed = 0;
    }
    
    updateCar(deltaTime) {
        // Update car based on input
        if (this.inputState.forward) {
            this.gameState.speed += this.gameState.acceleration;
        } else if (this.inputState.backward) {
            this.gameState.speed -= this.gameState.brakeForce;
        } else {
            // Natural deceleration
            if (this.gameState.speed > 0) {
                this.gameState.speed -= this.gameState.deceleration;
            } else if (this.gameState.speed < 0) {
                this.gameState.speed += this.gameState.deceleration;
            }
            
            // Prevent very small speed values
            if (Math.abs(this.gameState.speed) < 0.01) {
                this.gameState.speed = 0;
            }
        }
        
        // Clamp speed
        this.gameState.speed = Math.max(-this.gameState.maxSpeed / 2, Math.min(this.gameState.speed, this.gameState.maxSpeed));
        
        // Turning (only effective when moving)
        if (Math.abs(this.gameState.speed) > 0.1) {
            const turnMultiplier = this.gameState.speed > 0 ? 1 : -1;
            if (this.inputState.left) {
                this.car.rotation.y += this.gameState.turnSpeed * turnMultiplier;
            }
            if (this.inputState.right) {
                this.car.rotation.y -= this.gameState.turnSpeed * turnMultiplier;
            }
        }
        
        // Move car forward/backward in the direction it's facing
        const moveDistance = this.gameState.speed * deltaTime;
        this.car.position.x += Math.sin(this.car.rotation.y) * moveDistance;
        this.car.position.z += Math.cos(this.car.rotation.y) * moveDistance;
        
        // Keep car on the ground
        this.car.position.y = 0;
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        // Update speed display
        document.getElementById('speed').textContent = `Speed: ${Math.abs(Math.round(this.gameState.speed * 3.6))} km/h`;
        
        // Update time display
        document.getElementById('time').textContent = `Time: ${this.formatTime(this.gameState.time)}`;
    }
    
    formatTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateCamera() {
        // Position camera behind the car
        const cameraOffset = new THREE.Vector3(0, 3, -8);
        cameraOffset.applyQuaternion(this.car.quaternion);
        this.camera.position.copy(this.car.position).add(cameraOffset);
        
        // Make camera look at the car
        const lookAtPosition = new THREE.Vector3().copy(this.car.position);
        lookAtPosition.y += 1;
        this.camera.lookAt(lookAtPosition);
    }
    
    onWindowResize() {
        // Update camera aspect ratio and renderer size on window resize
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    gameLoop() {
        // Game loop using requestAnimationFrame
        requestAnimationFrame(() => this.gameLoop());
        
        const deltaTime = this.clock.getDelta();
        
        // Update game state
        if (this.gameState.isPlaying) {
            this.gameState.time += deltaTime;
            this.updateCar(deltaTime);
            this.updateCamera();
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create a new racing game instance
    const game = new RacingGame();
    game.gameState.isPlaying = true;
}); 