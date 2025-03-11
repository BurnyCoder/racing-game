import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { Car } from './car.js';
import { Track } from './track.js';
import { Utils } from './utils.js';

class Game {
    constructor() {
        // Game states
        this.isRacing = false;
        this.startTime = 0;
        this.currentTime = 0;
        
        // DOM elements
        this.container = document.getElementById('game-container');
        this.speedometer = document.getElementById('speedometer');
        this.timerElement = document.getElementById('timer');
        this.menu = document.getElementById('menu');
        this.startButton = document.getElementById('start-button');
        
        // Bind methods
        this.startRace = this.startRace.bind(this);
        this.update = this.update.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Initialize game components
        this.initThree();
        this.initPhysics();
        this.initCar();
        this.initTrack();
        this.initLights();
        this.initControls();
        this.initEventListeners();
        
        // Start the animation loop
        this.animate();
    }
    
    initThree() {
        // Create a scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
        
        // Create a camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 5, 10);
        
        // Create a renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }
    
    initPhysics() {
        // Create a physics world
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        
        this.world.defaultContactMaterial.friction = 0.2;
        this.world.defaultContactMaterial.restitution = 0.3;
        
        // Set up physics time step
        this.fixedTimeStep = 1.0 / 60.0;
        this.maxSubSteps = 3;
        
        // Last timestamp for physics update
        this.lastCallTime = performance.now();
    }
    
    initCar() {
        // Initialize the car
        this.car = new Car(this.scene, this.world);
        
        // Position the car at the start position
        this.car.chassisBody.position.set(0, 1, 0);
        
        // Set up chase camera for the car
        this.followCam = new THREE.Object3D();
        this.followCam.position.copy(this.car.chassis.position);
        this.followCam.position.add(new THREE.Vector3(0, 3, -8));
        this.scene.add(this.followCam);
    }
    
    initTrack() {
        // Initialize the track
        this.track = new Track(this.scene, this.world);
    }
    
    initLights() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        
        // Optimize shadow settings
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        
        this.scene.add(directionalLight);
    }
    
    initControls() {
        // Create orbit controls for development
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enabled = false; // Disable by default for racing mode
        
        // Set up key controls for the car
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            brake: false,
            reset: false
        };
    }
    
    initEventListeners() {
        // Add event listeners
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        this.startButton.addEventListener('click', this.startRace);
    }
    
    handleResize() {
        // Update camera and renderer on window resize
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    handleKeyDown(event) {
        // Handle key down events
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = true;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = true;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = true;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = true;
                break;
            case ' ':
                this.keys.brake = true;
                break;
            case 'r':
                this.keys.reset = true;
                break;
        }
    }
    
    handleKeyUp(event) {
        // Handle key up events
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = false;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = false;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = false;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = false;
                break;
            case ' ':
                this.keys.brake = false;
                break;
            case 'r':
                this.keys.reset = false;
                // Reset car position
                if (this.isRacing) {
                    this.car.resetPosition();
                }
                break;
        }
    }
    
    startRace() {
        // Start the race
        this.isRacing = true;
        this.startTime = performance.now();
        this.menu.style.display = 'none';
    }
    
    updateTimer() {
        // Update the timer display
        if (!this.isRacing) return;
        
        this.currentTime = performance.now() - this.startTime;
        const formattedTime = Utils.formatTime(this.currentTime);
        this.timerElement.textContent = formattedTime;
    }
    
    updateSpeedometer() {
        // Update the speedometer display
        const speed = Math.round(this.car.getSpeed());
        this.speedometer.textContent = `${speed} km/h`;
    }
    
    updateCamera() {
        // Update the camera position to follow the car
        if (!this.isRacing) return;
        
        // Get car position and rotation
        const carPos = new THREE.Vector3();
        this.car.chassis.getWorldPosition(carPos);
        
        // Calculate offset based on car's direction
        const carDirection = new THREE.Vector3();
        this.car.chassis.getWorldDirection(carDirection);
        
        // Position camera behind car with offset and height
        const cameraOffset = new THREE.Vector3(0, 3, -8);
        const quaternion = new THREE.Quaternion();
        this.car.chassis.getWorldQuaternion(quaternion);
        cameraOffset.applyQuaternion(quaternion);
        
        // Set camera position
        this.followCam.position.copy(carPos).add(cameraOffset);
        this.followCam.lookAt(carPos);
        
        // Smoothly move the actual camera to the follow cam
        this.camera.position.lerp(this.followCam.position, 0.1);
        this.camera.lookAt(carPos);
    }
    
    update() {
        // Update physics
        const time = performance.now();
        const dt = (time - this.lastCallTime) / 1000;
        this.lastCallTime = time;
        
        // Update physics world
        this.world.step(this.fixedTimeStep, dt, this.maxSubSteps);
        
        // Update car
        if (this.isRacing) {
            this.car.update(this.keys);
        }
        
        // Update track if needed
        this.track.update();
        
        // Update UI
        this.updateCamera();
        this.updateSpeedometer();
        this.updateTimer();
    }
    
    animate() {
        // Animation loop
        requestAnimationFrame(this.animate.bind(this));
        
        // Update game state
        this.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    const game = new Game();
}); 