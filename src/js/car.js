import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Car {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        
        // Car settings
        this.settings = {
            chassisMass: 150,
            wheelMass: 30,
            wheelRadius: 0.5,
            wheelWidth: 0.3,
            wheelFriction: 1.5,
            suspensionStiffness: 30,
            suspensionRestLength: 0.3,
            maxSuspensionTravel: 0.3,
            suspensionDamping: 4.4,
            maxSteeringAngle: Math.PI / 6,
            engineForce: 500,
            brakeForce: 100,
            maxSpeed: 200, // km/h
            initialPosition: new CANNON.Vec3(0, 1, 0)
        };
        
        // Create the car
        this.createChassis();
        this.createWheels();
        this.setupVehicle();
    }
    
    createChassis() {
        // Physical chassis body
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        this.chassisBody = new CANNON.Body({
            mass: this.settings.chassisMass,
            position: this.settings.initialPosition
        });
        this.chassisBody.addShape(chassisShape);
        this.chassisBody.angularVelocity.set(0, 0, 0);
        this.world.addBody(this.chassisBody);
        
        // Visual chassis (car body)
        this.chassis = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(2, 0.75, 4);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2288cc });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        this.chassis.add(bodyMesh);
        
        // Car cockpit
        const cockpitGeometry = new THREE.BoxGeometry(1.6, 0.5, 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const cockpitMesh = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpitMesh.position.set(0, 0.6, -0.5);
        cockpitMesh.castShadow = true;
        cockpitMesh.receiveShadow = true;
        this.chassis.add(cockpitMesh);
        
        // Front window
        const windowGeometry = new THREE.BoxGeometry(1.4, 0.4, 0.1);
        const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x88ccff });
        const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        frontWindow.position.set(0, 0.6, -1.55);
        frontWindow.rotation.x = Math.PI / 6;
        this.chassis.add(frontWindow);
        
        // Add the chassis to the scene
        this.scene.add(this.chassis);
    }
    
    createWheels() {
        // Wheel geometry and material
        const wheelGeometry = new THREE.CylinderGeometry(
            this.settings.wheelRadius, 
            this.settings.wheelRadius, 
            this.settings.wheelWidth, 
            24
        );
        wheelGeometry.rotateZ(Math.PI / 2);
        
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        // Wheel positions
        const wheelPositions = [
            // Front left
            new THREE.Vector3(-1, 0, -1.2),
            // Front right
            new THREE.Vector3(1, 0, -1.2),
            // Back left
            new THREE.Vector3(-1, 0, 1.2),
            // Back right
            new THREE.Vector3(1, 0, 1.2)
        ];
        
        // Create wheels
        this.wheelMeshes = [];
        wheelPositions.forEach(position => {
            const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheelMesh.position.copy(position);
            wheelMesh.castShadow = true;
            this.chassis.add(wheelMesh);
            this.wheelMeshes.push(wheelMesh);
        });
    }
    
    setupVehicle() {
        // Create the vehicle
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexRightAxis: 0, // x
            indexUpAxis: 1,    // y
            indexForwardAxis: 2 // z
        });
        
        // Wheel options
        const wheelOptions = {
            radius: this.settings.wheelRadius,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: this.settings.suspensionStiffness,
            suspensionRestLength: this.settings.suspensionRestLength,
            frictionSlip: this.settings.wheelFriction,
            dampingRelaxation: this.settings.suspensionDamping,
            dampingCompression: this.settings.suspensionDamping,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            maxSuspensionTravel: this.settings.maxSuspensionTravel,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };
        
        // Wheel positions (matching the visual wheels)
        const wheelPositions = [
            new CANNON.Vec3(-1, 0, -1.2), // Front left
            new CANNON.Vec3(1, 0, -1.2),  // Front right
            new CANNON.Vec3(-1, 0, 1.2),  // Back left
            new CANNON.Vec3(1, 0, 1.2)    // Back right
        ];
        
        // Add wheels to vehicle
        this.wheelBodies = [];
        wheelPositions.forEach(position => {
            const wheelOptions_ = Object.assign({}, wheelOptions);
            wheelOptions_.chassisConnectionPointLocal = position;
            this.vehicle.addWheel(wheelOptions_);
        });
        
        // Create wheel bodies
        this.vehicle.addToWorld(this.world);
        const wheels = this.vehicle.wheelInfos;
        
        for (let i = 0; i < wheels.length; i++) {
            const wheel = this.vehicle.wheelInfos[i];
            const cylinderShape = new CANNON.Cylinder(
                wheel.radius, 
                wheel.radius, 
                this.settings.wheelWidth, 
                20
            );
            
            const wheelBody = new CANNON.Body({
                mass: this.settings.wheelMass,
                material: new CANNON.Material('wheel')
            });
            
            const quaternion = new CANNON.Quaternion().setFromAxisAngle(
                new CANNON.Vec3(1, 0, 0), 
                Math.PI / 2
            );
            
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
            this.wheelBodies.push(wheelBody);
        }
        
        // Store original position for reset
        this.originalPosition = this.settings.initialPosition.clone();
    }
    
    update(keys) {
        // Update steering based on keys
        const maxSteeringAngle = this.settings.maxSteeringAngle;
        
        if (keys.left) {
            this.vehicle.setSteeringValue(maxSteeringAngle, 0);
            this.vehicle.setSteeringValue(maxSteeringAngle, 1);
        } else if (keys.right) {
            this.vehicle.setSteeringValue(-maxSteeringAngle, 0);
            this.vehicle.setSteeringValue(-maxSteeringAngle, 1);
        } else {
            this.vehicle.setSteeringValue(0, 0);
            this.vehicle.setSteeringValue(0, 1);
        }
        
        // Apply engine force based on keys
        const engineForce = this.settings.engineForce;
        
        if (keys.forward) {
            this.vehicle.applyEngineForce(engineForce, 2);
            this.vehicle.applyEngineForce(engineForce, 3);
        } else if (keys.backward) {
            this.vehicle.applyEngineForce(-engineForce, 2);
            this.vehicle.applyEngineForce(-engineForce, 3);
        } else {
            this.vehicle.applyEngineForce(0, 2);
            this.vehicle.applyEngineForce(0, 3);
        }
        
        // Apply brakes if brake key is pressed
        const brakeForce = this.settings.brakeForce;
        if (keys.brake) {
            this.vehicle.setBrake(brakeForce, 0);
            this.vehicle.setBrake(brakeForce, 1);
            this.vehicle.setBrake(brakeForce, 2);
            this.vehicle.setBrake(brakeForce, 3);
        } else {
            this.vehicle.setBrake(0, 0);
            this.vehicle.setBrake(0, 1);
            this.vehicle.setBrake(0, 2);
            this.vehicle.setBrake(0, 3);
        }
        
        // Update chassis and wheel positions
        this.updateVisuals();
    }
    
    updateVisuals() {
        // Update chassis position and rotation
        this.chassis.position.copy(this.chassisBody.position);
        this.chassis.quaternion.copy(this.chassisBody.quaternion);
        
        // Update wheel positions and rotations
        for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
            this.vehicle.updateWheelTransform(i);
            const transform = this.vehicle.wheelInfos[i].worldTransform;
            const wheelMesh = this.wheelMeshes[i];
            wheelMesh.position.copy(transform.position);
            wheelMesh.quaternion.copy(transform.quaternion);
        }
    }
    
    getSpeed() {
        // Calculate car speed in km/h
        const velocity = this.chassisBody.velocity;
        const speed = Math.sqrt(
            velocity.x * velocity.x + 
            velocity.y * velocity.y + 
            velocity.z * velocity.z
        );
        
        return speed * 3.6; // Convert m/s to km/h
    }
    
    resetPosition() {
        // Reset car position and orientation
        this.chassisBody.position.copy(this.originalPosition);
        this.chassisBody.quaternion.set(0, 0, 0, 1);
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
        
        // Reset wheels
        for (let i = 0; i < 4; i++) {
            this.vehicle.wheelInfos[i].suspensionLength = 0;
            this.vehicle.wheelInfos[i].rotation = 0;
        }
    }
} 