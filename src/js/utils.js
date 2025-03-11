export class Utils {
    /**
     * Formats time in milliseconds to a readable format (MM:SS:ms)
     * @param {number} timeInMs - Time in milliseconds
     * @returns {string} - Formatted time string
     */
    static formatTime(timeInMs) {
        const totalSeconds = Math.floor(timeInMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((timeInMs % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Linear interpolation
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} - Interpolated value
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * Clamps a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Clamped value
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }
    
    /**
     * Checks if a point is within a bounding box
     * @param {THREE.Vector3} point - Point to check
     * @param {THREE.Vector3} boxPosition - Box center position
     * @param {THREE.Vector3} boxSize - Box size (width, height, depth)
     * @returns {boolean} - True if point is inside the box
     */
    static isPointInBox(point, boxPosition, boxSize) {
        return (
            point.x >= boxPosition.x - boxSize.x / 2 &&
            point.x <= boxPosition.x + boxSize.x / 2 &&
            point.y >= boxPosition.y - boxSize.y / 2 &&
            point.y <= boxPosition.y + boxSize.y / 2 &&
            point.z >= boxPosition.z - boxSize.z / 2 &&
            point.z <= boxPosition.z + boxSize.z / 2
        );
    }
    
    /**
     * Converts radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} - Angle in degrees
     */
    static toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    /**
     * Converts degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} - Angle in radians
     */
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Generates a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Random integer
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Calculates the distance between two points
     * @param {THREE.Vector3} point1 - First point
     * @param {THREE.Vector3} point2 - Second point
     * @returns {number} - Distance between the points
     */
    static distance(point1, point2) {
        return Math.sqrt(
            Math.pow(point2.x - point1.x, 2) +
            Math.pow(point2.y - point1.y, 2) +
            Math.pow(point2.z - point1.z, 2)
        );
    }
} 