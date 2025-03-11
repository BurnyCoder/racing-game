import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Track {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        
        // Track elements
        this.trackElements = [];
        this.checkpoints = [];
        
        // Create the track
        this.createGround();
        this.createTrackElements();
        this.createFinishLine();
    }
    
    createGround() {
        // Create visual ground
        const groundSize = 100;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a5e1a,
            metalness: 0.1,
            roughness: 0.9
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Create physical ground
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0, // Static body
            material: new CANNON.Material('ground')
        });
        
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0), 
            -Math.PI / 2
        );
        
        this.world.addBody(groundBody);
        
        // Add grid for visual reference
        const gridHelper = new THREE.GridHelper(groundSize, 40, 0x000000, 0x000000);
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }
    
    createTrackElements() {
        // Define track layout
        // This is a basic track with some turns, a bridge, and a loop
        this.addStraight(0, 0, 20, 8, 0);
        this.addCorner(20, 0, 15, 8, 0, Math.PI / 2);
        this.addStraight(35, 0, 15, 8, Math.PI / 2);
        this.addCorner(35, 15, 15, 8, Math.PI / 2, Math.PI);
        this.addStraight(20, 15, 15, 8, Math.PI);
        
        // Add a raised section/bridge
        this.addRamp(5, 15, 10, 8, Math.PI, Math.PI / 12);
        this.addStraight(0, 15, 5, 8, Math.PI, 10);
        this.addRamp(-5, 15, 5, 8, Math.PI, -Math.PI / 12, 10);
        
        // Continue the track
        this.addCorner(-10, 15, 10, 8, Math.PI, -Math.PI / 2);
        this.addStraight(-10, 5, 10, 8, -Math.PI / 2);
        this.addCorner(-10, -5, 10, 8, -Math.PI / 2, 0);
        
        // Add a loop
        this.addLoop(-5, -5, 5, 8, 0);
    }
    
    createFinishLine() {
        // Create the finish line
        const finishLine = new THREE.Group();
        
        // Striped texture for finish line
        const stripes = [];
        for (let i = 0; i < 10; i++) {
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.1, 0.8),
                new THREE.MeshPhongMaterial({ 
                    color: i % 2 === 0 ? 0xffffff : 0x000000 
                })
            );
            stripe.position.set(i * 0.8 - 3.6, 0.05, 0);
            stripe.receiveShadow = true;
            stripes.push(stripe);
            finishLine.add(stripe);
        }
        
        // Add finish line posts
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
        const postMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        
        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        leftPost.position.set(-4, 2.5, 0);
        leftPost.castShadow = true;
        finishLine.add(leftPost);
        
        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        rightPost.position.set(4, 2.5, 0);
        rightPost.castShadow = true;
        finishLine.add(rightPost);
        
        // Add banner
        const bannerGeometry = new THREE.BoxGeometry(8, 1, 0.2);
        const bannerMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
        banner.position.set(0, 5, 0);
        banner.castShadow = true;
        finishLine.add(banner);
        
        // Position the finish line at the start of the track
        finishLine.position.set(0, 0, -4);
        this.scene.add(finishLine);
        
        // Add checkpoint for lap detection
        this.checkpoints.push({
            position: new THREE.Vector3(0, 0, -4),
            size: new THREE.Vector3(8, 2, 1)
        });
    }
    
    addStraight(x, z, length, width, rotation, height = 0) {
        // Create straight track segment
        const segmentGeometry = new THREE.BoxGeometry(width, 0.5, length);
        const segmentMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        
        // Position and rotate the segment
        segment.position.set(x, height + 0.25, z);
        segment.rotation.y = rotation;
        segment.receiveShadow = true;
        this.scene.add(segment);
        this.trackElements.push(segment);
        
        // Create physical body for the segment
        const segmentShape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.25, length / 2));
        const segmentBody = new CANNON.Body({
            mass: 0, // Static body
            position: new CANNON.Vec3(x, height + 0.25, z),
            material: new CANNON.Material('track')
        });
        
        segmentBody.addShape(segmentShape);
        segmentBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(0, 1, 0),
            rotation
        );
        
        this.world.addBody(segmentBody);
    }
    
    addCorner(x, z, radius, width, startAngle, endAngle) {
        // Create visual corner segment
        const curveGeometry = new THREE.RingGeometry(
            radius - width / 2, 
            radius + width / 2, 
            32, 
            8, 
            startAngle, 
            endAngle - startAngle
        );
        
        // Adjust geometry to be flat on XZ plane
        curveGeometry.rotateX(-Math.PI / 2);
        
        const curveMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide
        });
        
        const curve = new THREE.Mesh(curveGeometry, curveMaterial);
        curve.position.set(x, 0.25, z);
        curve.receiveShadow = true;
        this.scene.add(curve);
        this.trackElements.push(curve);
        
        // For physics, we'll use a simplified approximation with multiple boxes
        const angleStep = (endAngle - startAngle) / 8;
        for (let i = 0; i < 8; i++) {
            const angle = startAngle + angleStep * i + angleStep / 2;
            const boxX = x + Math.cos(angle) * radius;
            const boxZ = z + Math.sin(angle) * radius;
            
            const boxShape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.25, angleStep * radius));
            const boxBody = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(boxX, 0.25, boxZ),
                material: new CANNON.Material('track')
            });
            
            boxBody.addShape(boxShape);
            boxBody.quaternion.setFromAxisAngle(
                new CANNON.Vec3(0, 1, 0),
                angle + Math.PI / 2
            );
            
            this.world.addBody(boxBody);
        }
    }
    
    addRamp(x, z, length, width, rotation, incline, height = 0) {
        // Calculate end height based on incline
        const endHeight = height + Math.sin(incline) * length;
        
        // Create visual ramp
        const rampGeometry = new THREE.BoxGeometry(width, 0.5, length);
        const rampMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        
        // Position the ramp
        ramp.position.set(
            x, 
            (height + endHeight) / 2 + 0.25, 
            z
        );
        ramp.rotation.y = rotation;
        ramp.rotation.x = incline;
        ramp.receiveShadow = true;
        this.scene.add(ramp);
        this.trackElements.push(ramp);
        
        // Create physical body for the ramp
        const rampShape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.25, length / 2));
        const rampBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(
                x, 
                (height + endHeight) / 2 + 0.25, 
                z
            ),
            material: new CANNON.Material('track')
        });
        
        rampBody.addShape(rampShape);
        
        // Apply rotations
        const q1 = new CANNON.Quaternion();
        q1.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
        
        const q2 = new CANNON.Quaternion();
        q2.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), incline);
        
        q1.mult(q2, rampBody.quaternion);
        
        this.world.addBody(rampBody);
    }
    
    addLoop(x, z, radius, width, rotation) {
        // Create a full 360-degree loop
        const segments = 16;
        const angleStep = (Math.PI * 2) / segments;
        
        for (let i = 0; i < segments; i++) {
            const angle = i * angleStep;
            const nextAngle = (i + 1) * angleStep;
            
            // Calculate positions for this segment
            const y1 = radius * Math.sin(angle);
            const z1 = radius * Math.cos(angle);
            
            const y2 = radius * Math.sin(nextAngle);
            const z2 = radius * Math.cos(nextAngle);
            
            // Create geometry for the segment
            const points = [
                new THREE.Vector3(-width / 2, y1, z1),
                new THREE.Vector3(width / 2, y1, z1),
                new THREE.Vector3(width / 2, y2, z2),
                new THREE.Vector3(-width / 2, y2, z2)
            ];
            
            const segmentGeometry = new THREE.BufferGeometry();
            const vertices = [];
            
            // Front face
            vertices.push(...points[0].toArray());
            vertices.push(...points[1].toArray());
            vertices.push(...points[2].toArray());
            
            vertices.push(...points[0].toArray());
            vertices.push(...points[2].toArray());
            vertices.push(...points[3].toArray());
            
            segmentGeometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(vertices, 3)
            );
            
            segmentGeometry.computeVertexNormals();
            
            const segmentMaterial = new THREE.MeshPhongMaterial({
                color: 0x444444,
                side: THREE.DoubleSide
            });
            
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.position.set(x, 0, z);
            segment.rotation.y = rotation;
            segment.castShadow = true;
            segment.receiveShadow = true;
            
            this.scene.add(segment);
            this.trackElements.push(segment);
            
            // Add physics body
            const centerY = (y1 + y2) / 2;
            const centerZ = (z1 + z2) / 2;
            
            const boxShape = new CANNON.Box(new CANNON.Vec3(
                width / 2,
                Math.abs(y2 - y1) / 2 + 0.1,
                Math.abs(z2 - z1) / 2 + 0.1
            ));
            
            const boxBody = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(x, centerY, z + centerZ),
                material: new CANNON.Material('track')
            });
            
            boxBody.addShape(boxShape);
            boxBody.quaternion.setFromAxisAngle(
                new CANNON.Vec3(0, 1, 0),
                rotation
            );
            
            // Additional rotation for the segment
            const q2 = new CANNON.Quaternion();
            q2.setFromAxisAngle(
                new CANNON.Vec3(1, 0, 0),
                angle + angleStep / 2
            );
            
            boxBody.quaternion.mult(q2, boxBody.quaternion);
            
            this.world.addBody(boxBody);
        }
    }
    
    update() {
        // Update any animated track elements if needed
        // Currently not implemented
    }
} 