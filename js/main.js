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
            isPlaying: false,
            // Bunnyhopping mechanics
            isJumping: false,
            jumpHeight: 0,
            jumpSpeed: 0,
            jumpForce: 15,
            gravity: 30,
            jumpCooldown: 0,
            jumpCooldownTime: 0.3,
            consecutiveJumps: 0,
            maxConsecutiveJumps: 3,
            speedBoostPerJump: 3
        };
        
        // Controls state
        this.inputState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
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
        
        // Explicitly start the game
        this.gameState.isPlaying = true;
        console.log("Game initialized, isPlaying set to:", this.gameState.isPlaying);
        
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
        // Create a textured ground plane with grid for better movement feedback
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
        
        // Create a grid texture
        const textureSize = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = textureSize;
        canvas.height = textureSize;
        const context = canvas.getContext('2d');
        
        // Set background color
        context.fillStyle = '#1e7744';  // Grass green
        context.fillRect(0, 0, textureSize, textureSize);
        
        // Draw grid lines
        context.strokeStyle = '#2a8c54';  // Slightly lighter green
        context.lineWidth = 2;
        
        // Draw larger grid squares - main grid
        const gridSize = 64;
        for (let i = 0; i <= textureSize; i += gridSize) {
            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, textureSize);
            context.stroke();
            
            context.beginPath();
            context.moveTo(0, i);
            context.lineTo(textureSize, i);
            context.stroke();
        }
        
        // Draw smaller grid squares inside - secondary grid
        context.strokeStyle = '#25804b';  // Even more subtle grid
        context.lineWidth = 1;
        const smallGridSize = 16;
        for (let i = 0; i <= textureSize; i += smallGridSize) {
            // Skip if this is already covered by the main grid
            if (i % gridSize === 0) continue;
            
            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, textureSize);
            context.stroke();
            
            context.beginPath();
            context.moveTo(0, i);
            context.lineTo(textureSize, i);
            context.stroke();
        }
        
        // Create some random darker patches for variety
        context.fillStyle = '#185e35';  // Darker green
        for (let i = 0; i < 50; i++) {
            const size = Math.random() * 50 + 20;
            const x = Math.random() * (textureSize - size);
            const y = Math.random() * (textureSize - size);
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);  // Repeat the texture many times for a dense grid
        
        // Create material with the texture
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: texture,
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
        if (!this.gameState.isPlaying) return;
        
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
            case ' ': // Space bar for jumping
                this.inputState.jump = true;
                this.tryJump();
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
            case ' ': // Space bar for jumping
                this.inputState.jump = false;
                break;
        }
    }
    
    tryJump() {
        // Only jump if on the ground and cooldown is over
        if (!this.gameState.isJumping && this.gameState.jumpCooldown <= 0) {
            this.gameState.isJumping = true;
            this.gameState.jumpSpeed = this.gameState.jumpForce;
            
            // Track consecutive jumps for bunnyhopping
            if (Math.abs(this.gameState.speed) > 5) {
                this.gameState.consecutiveJumps++;
                
                // Apply speed boost for consecutive jumps (bunnyhopping)
                if (this.gameState.consecutiveJumps > 1 && this.gameState.consecutiveJumps <= this.gameState.maxConsecutiveJumps) {
                    const speedBoost = this.gameState.speedBoostPerJump * (this.gameState.consecutiveJumps - 1);
                    const speedDirection = this.gameState.speed > 0 ? 1 : -1;
                    this.gameState.speed += speedBoost * speedDirection;
                }
            }
            
            // Apply jump cooldown
            this.gameState.jumpCooldown = this.gameState.jumpCooldownTime;
        }
    }
    
    resetCar() {
        // Reset car position and rotation to the starting position
        this.car.position.set(0, 0, 0);
        this.car.rotation.y = 0;
        this.gameState.speed = 0;
        this.gameState.isJumping = false;
        this.gameState.jumpHeight = 0;
        this.gameState.jumpSpeed = 0;
        this.gameState.consecutiveJumps = 0;
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
        
        // Update jump cooldown
        if (this.gameState.jumpCooldown > 0) {
            this.gameState.jumpCooldown -= deltaTime;
        }
        
        // Handle jumping and gravity
        if (this.gameState.isJumping) {
            // Apply jump velocity
            this.gameState.jumpHeight += this.gameState.jumpSpeed * deltaTime;
            
            // Apply gravity to jump speed
            this.gameState.jumpSpeed -= this.gameState.gravity * deltaTime;
            
            // Check if landed
            if (this.gameState.jumpHeight <= 0) {
                this.gameState.jumpHeight = 0;
                this.gameState.jumpSpeed = 0;
                this.gameState.isJumping = false;
                
                // Reset consecutive jumps if jump button isn't held
                if (!this.inputState.jump) {
                    this.gameState.consecutiveJumps = 0;
                }
            }
        }
        
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
        
        // Apply jump height to car's Y position
        this.car.position.y = this.gameState.jumpHeight;
        
        // Check for track boundaries (simple collision)
        this.checkTrackBoundaries();
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        // Update speed display
        document.getElementById('speed').textContent = `Speed: ${Math.abs(Math.round(this.gameState.speed * 3.6))} km/h`;
        
        // Add jump information
        const speedElement = document.getElementById('speed');
        if (this.gameState.consecutiveJumps > 1) {
            speedElement.innerHTML += ` <span style="color: #ffcc00;">+${this.gameState.consecutiveJumps - 1} HOPS</span>`;
        }
        
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
    
    // Add the missing checkTrackBoundaries method
    checkTrackBoundaries() {
        // Simple track boundary check based on distance from track center
        const centerDistance = Math.sqrt(this.car.position.x * this.car.position.x + this.car.position.z * this.car.position.z);
        
        // We track if the car is on the track, but don't modify speed
        const isOnTrack = centerDistance <= 110 && centerDistance >= 20;
        
        // Update the off-track state for visual or sound effects if needed
        this.gameState.isOffTrack = !isOnTrack;
    }
}

// Initialize the game once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create a new racing game instance
    const game = new RacingGame();
    game.gameState.isPlaying = true;
}); 