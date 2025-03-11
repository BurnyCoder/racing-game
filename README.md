# Trackmania Clone

A Trackmania-inspired racing game built with Three.js and Cannon.js physics.

![Trackmania Clone Screenshot](screenshot.png)
(Screenshot will be available after running the game)

## Features

- 3D racing game with realistic physics
- Car controls with acceleration, braking, and steering
- Custom track with various elements:
  - Straights
  - Corners
  - Ramps
  - Elevated sections
  - Loops
- Timer and speedometer
- Start/finish line

## Controls

- **W / Up Arrow**: Accelerate
- **S / Down Arrow**: Brake/Reverse
- **A / Left Arrow**: Steer Left
- **D / Right Arrow**: Steer Right
- **Space**: Handbrake
- **R**: Reset Car Position

## Getting Started

### Prerequisites

- Node.js installed on your system
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/trackmania-clone.git
cd trackmania-clone
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173/`

## Technical Implementation

This game is built using:

- **Three.js** - For 3D rendering
- **Cannon.js** - For physics simulation
- **Vite** - For bundling and development server

The codebase is organized as follows:

- `main.js` - Entry point that sets up the game
- `car.js` - Car physics and visuals
- `track.js` - Track generation and obstacles
- `utils.js` - Helper functions

## Future Improvements

- Add multiple track layouts
- Implement lap counting and ghost cars
- Add more vehicle options with different handling characteristics
- Add sound effects and music
- Implement a track editor

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the original Trackmania series by Nadeo
- Built with Three.js and Cannon.js 