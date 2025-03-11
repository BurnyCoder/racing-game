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
        this.track = null;
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
            lap: 1,
            maxLaps: 3,
            time: 0,
            isPlaying: false,
            isOffTrack: false
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
        
        // Create track
        this.createTrack();
        
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
    
    createTrack() {
        // Create a simple race track (oval shape)
        const trackGroup = new THREE.Group();
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1e7744,  // Grass green
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        trackGroup.add(ground);
        
        // Race track
        const trackShape = new THREE.Shape();
        
        // Outer track boundary
        trackShape.moveTo(-100, -50);
        trackShape.lineTo(100, -50);
        trackShape.absarc(100, 0, 50, Math.PI * 1.5, Math.PI * 0.5, true);
        trackShape.lineTo(-100, 50);
        trackShape.absarc(-100, 0, 50, Math.PI * 0.5, Math.PI * 1.5, true);
        
        // Inner track boundary (hole)
        const holeShape = new THREE.Path();
        holeShape.moveTo(-80, -30);
        holeShape.lineTo(80, -30);
        holeShape.absarc(80, 0, 30, Math.PI * 1.5, Math.PI * 0.5, true);
        holeShape.lineTo(-80, 30);
        holeShape.absarc(-80, 0, 30, Math.PI * 0.5, Math.PI * 1.5, true);
        trackShape.holes.push(holeShape);
        
        // Create track mesh
        const trackGeometry = new THREE.ShapeGeometry(trackShape);
        const trackMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,  // Dark gray asphalt
            roughness: 0.7,
            metalness: 0.1
        });
        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        track.rotation.x = -Math.PI / 2;
        track.position.y = 0.1; // Slightly above ground
        track.receiveShadow = true;
        trackGroup.add(track);
        
        // Add some track markings
        this.addTrackMarkings(trackGroup);
        
        this.track = trackGroup;
        this.scene.add(this.track);
    }
    
    addTrackMarkings(trackGroup) {
        // Starting line
        const startLineGeometry = new THREE.PlaneGeometry(15, 2);
        const startLineMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.2
        });
        const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.set(-100, 0.2, 0);
        trackGroup.add(startLine);
        
        // Track edge lines (white)
        const createTrackEdge = (radius, y, segments = 64) => {
            const points = [];
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    Math.cos(theta) * radius,
                    y,
                    Math.sin(theta) * radius
                ));
            }
            return points;
        };
        
        // Inner edge
        const innerPoints = [
            ...createTrackEdge(30, 0.2).filter(p => p.x > 0 && p.z > -30 && p.z < 30),
            ...createTrackEdge(30, 0.2).filter(p => p.x < 0 && p.z > -30 && p.z < 30)
        ];
        
        // Add straight sections for inner edge
        for (let x = -80; x <= 80; x += 2) {
            innerPoints.push(new THREE.Vector3(x, 0.2, -30));
            innerPoints.push(new THREE.Vector3(x, 0.2, 30));
        }
        
        // Outer edge
        const outerPoints = [
            ...createTrackEdge(50, 0.2).filter(p => p.x > 0 && p.z > -50 && p.z < 50),
            ...createTrackEdge(50, 0.2).filter(p => p.x < 0 && p.z > -50 && p.z < 50)
        ];
        
        // Add straight sections for outer edge
        for (let x = -100; x <= 100; x += 2) {
            outerPoints.push(new THREE.Vector3(x, 0.2, -50));
            outerPoints.push(new THREE.Vector3(x, 0.2, 50));
        }
        
        // Create edge line materials
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        
        // Create edge lines
        const innerEdgeGeometry = new THREE.BufferGeometry().setFromPoints(innerPoints);
        const innerEdge = new THREE.Line(innerEdgeGeometry, edgeMaterial);
        trackGroup.add(innerEdge);
        
        const outerEdgeGeometry = new THREE.BufferGeometry().setFromPoints(outerPoints);
        const outerEdge = new THREE.Line(outerEdgeGeometry, edgeMaterial);
        trackGroup.add(outerEdge);
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
        
        // Position the car at the starting line
        carGroup.position.set(-90, 0, 0);
        carGroup.rotation.y = Math.PI / 2;
        
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
        this.car.position.set(-90, 0, 0);
        this.car.rotation.y = Math.PI / 2;
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
        
        // Check for track boundaries (simple collision)
        this.checkTrackBoundaries();
        
        // Check for lap completion
        this.checkLap();
        
        // Update UI
        this.updateUI();
    }
    
    checkTrackBoundaries() {
        // Simple track boundary check based on distance from track center
        const centerDistance = Math.sqrt(this.car.position.x * this.car.position.x + this.car.position.z * this.car.position.z);
        
        // We still track if the car is on the track, but don't modify speed
        const isOnTrack = centerDistance <= 110 && centerDistance >= 20;
        
        // Update the off-track state for visual or sound effects if needed
        this.gameState.isOffTrack = !isOnTrack;
        
        // No speed modifications here - max speed will be enforced uniformly
        // by the clamping in the updateCar method
    }
    
    checkLap() {
        // Check if car crosses the starting line
        const isNearStartLine = (
            this.car.position.x < -85 && 
            this.car.position.x > -95 && 
            Math.abs(this.car.position.z) < 10 &&
            this.gameState.speed > 0
        );
        
        // To prevent multiple lap counts, use a simple state machine
        if (isNearStartLine && !this.crossingStartLine) {
            this.crossingStartLine = true;
            this.gameState.lap++;
            
            if (this.gameState.lap > this.gameState.maxLaps) {
                this.gameState.isPlaying = false;
                alert(`Race finished! Your time: ${this.formatTime(this.gameState.time)}`);
                this.resetCar();
                this.gameState.lap = 1;
                this.gameState.time = 0;
                this.gameState.isPlaying = true;
            }
        } else if (!isNearStartLine && this.crossingStartLine) {
            this.crossingStartLine = false;
        }
    }
    
    updateUI() {
        // Update speed display
        document.getElementById('speed').textContent = `Speed: ${Math.abs(Math.round(this.gameState.speed * 3.6))} km/h`;
        
        // Update lap display
        document.getElementById('lap').textContent = `Lap: ${this.gameState.lap}/${this.gameState.maxLaps}`;
        
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