# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **complete SNES-style 2D JRPG Framework** built with TypeScript and Vite. The framework is designed to be modular, data-driven, and optimized for creating authentic 16-bit JRPG experiences with Kenney sprite assets. It includes a full ECS architecture, advanced rendering, audio system, animation controller, and smooth grid-based movement.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with hot reload on port 3000
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm test` - Run tests using Vitest
- `npm run test:ui` - Run tests with Vitest UI interface
- `npm run lint` - Lint TypeScript files in src directory
- `npm run format` - Format code using Prettier

### Testing
- Tests are run using **Vitest** with jsdom environment (configured in `vitest.config.ts`)
- Test files should follow the pattern `*.test.ts` or `*.spec.ts`
- Tests directory exists but is currently empty
- Use `npm run test:ui` for interactive test debugging
- Use `npm run test` for continuous testing during development

## Architecture Overview

### Core Framework Structure

The framework follows an **Entity-Component-System (ECS)** architecture with these key modules:

#### 1. ECS System (`src/core/ecs/`)
- **World**: Central ECS coordinator managing entities, components, and systems
- **Entity**: Lightweight objects with unique IDs
- **Component**: Data containers registered via decorators (`@RegisterComponent`)
- **System**: Logic processors that operate on component queries
- **Query**: Flexible component filtering system

#### 2. Core Components (`src/core/ecs/components/CoreComponents.ts`)
Essential JRPG components include:
- `Transform` - Position, rotation, scale
- `Sprite` - Visual rendering with Kenney asset support
- `Stats` - RPG statistics (HP, MP, STR, DEX, INT, VIT, SPD, LUCK)
- `Inventory` - Item storage and management
- `Brain` - AI/Player control system
- `Collider` - Physics collision detection
- `RigidBody` - Kinematic movement
- `Faction` - Team/enemy relationships
- `Interactable` - Interactive objects (NPCs, chests, doors)
- `AnimationState` - Animation control

#### 3. Math System (`src/core/math/`)
- `Vec2` - 2D vector operations with comprehensive methods
- `Rect` - Rectangle collision and bounds
- `RNG` - Random number generation utilities

#### 4. Time System (`src/core/time/`)
- `GameLoop` - Fixed timestep game loop with interpolation
- `Scheduler` - Task scheduling system for timed events
- `Tween` - Animation tweening system

#### 5. Asset Management (`src/core/assets/`)
- `AssetManager` - Singleton asset loader for Kenney sprites and texture atlases
- Support for JSON atlas files and manual sprite frame creation
- Async loading with error handling and fallback systems

#### 6. Advanced Rendering (`src/core/rendering/`)
- `SpriteRenderer` - Pixel-perfect sprite rendering with SNES-style effects
- Smooth 360-degree rotation while maintaining pixel art quality
- Layer-based rendering, tinting, blending, and debug modes
- Scanline and CRT effects for authentic retro feel

#### 7. Audio System (`src/core/audio/`)
- `AudioManager` - Complete audio management using Howler.js
- Support for music, SFX, and voice categories with independent volume control
- Crossfading, procedural SNES-style sound effects
- Modern browser audio context handling

#### 8. Animation System (`src/core/animation/`)
- `AnimationController` - Frame-based sprite animation with events
- Support for looping, ping-pong, and complex timing
- Animation blending and state management

#### 9. Grid Movement (`src/core/movement/`)
- `GridMovementController` - Smooth grid-based movement with easing
- Support for 4-directional and diagonal movement
- Pathfinding and movement validation
- Smooth interpolation between grid positions

#### 10. Enhanced Components
- `Animator` - Advanced animation controller component
- `GridMovement` - Grid-based movement component
- `PlayerInput` - Input handling with cooldowns and buffering

### Module Aliases

The project uses TypeScript path mapping:
- `@core/*` → `src/core/*`
- `@game/*` → `src/game/*` 
- `@assets/*` → `assets/*`
- `@data/*` → `data/*`

### Canvas Rendering

The framework uses **HTML5 Canvas** with 2D context:
- Default resolution: 800x600
- Pixel-perfect rendering enabled
- Debug info overlay in top-left corner
- Main rendering loop handles entity queries and sprite drawing

## Dependencies

### Core Dependencies
- **Howler.js** (`howler`): Audio management library for sound effects and music
- **@types/howler**: TypeScript definitions for Howler.js (optional dependency)

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Language and compiler (ES2020 target)
- **Vitest**: Testing framework with jsdom environment
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **@vitest/ui**: Visual test interface

## Development Guidelines

### Kenney Asset Integration (See Asset Management section)
- Primary assets located at `C:\Users\Ville Peuho\uho-fate-of-grid\assets\sprites\16bit\zip\`
- Maintain 16-bit aesthetic with pixel-perfect rendering
- Support for smooth 360-degree rotation and scaling
- Advanced graphical effects inspired by SNES/retro consoles

### Component Development
- Always use `@RegisterComponent('ComponentName')` decorator
- Implement the `Component` interface with `__componentType` property
- Keep components as pure data containers
- Complex logic belongs in Systems, not Components

### System Development
- Systems should extend the base `System` class
- Use `Query` objects to efficiently filter entities by components
- Implement `update(dt: number)` for time-based logic
- Use `initialize()` and `cleanup()` for system lifecycle

### Performance Considerations
- ECS queries are cached and invalidated on component changes
- Fixed timestep ensures consistent simulation
- Sprite rendering uses transform matrices for efficient drawing
- Debug info updates are throttled to maintain performance

### Asset Management
- Sprites reference textures by string IDs
- Frame rectangles define sprite regions within spritesheets
- Anchor points support flexible sprite positioning
- Layer system supports z-ordering

#### Kenney Asset Integration
- **Primary asset location**: `C:\Users\Ville Peuho\uho-fate-of-grid\assets\sprites\16bit\zip\`
- Use only high-quality Kenney sprite assets for consistent 16-bit aesthetic
- Maintain pixel-perfect rendering with `image-rendering: pixelated` CSS
- Support smooth 360-degree rotation while preserving pixel art quality
- Implement smooth grid-based movement with advanced graphical effects
- Backgrounds and environments should scroll and zoom smoothly
- Target SNES/retro console visual quality with modern performance

## Testing Strategy

- Unit tests for math utilities (Vec2, Rect, RNG)
- Component serialization/deserialization tests
- System behavior verification
- Game loop timing accuracy tests
- Use Vitest's `@vitest/ui` for visual test debugging

## Demo Game

The framework includes a complete playable demo showcasing all systems:

### Player Controls
- **WASD/Arrow Keys**: Move player character with smooth grid movement
- **Space**: Play jump sound effect
- **C**: Play coin sound effect
- **M**: Toggle audio mute

### Demo Features
- Player-controlled character with walking animations
- Animated NPC with patrol behavior
- Environmental tile grid with alternating colors
- Real-time position tracking and movement state display
- SNES-style procedural sound effects
- Pixel-perfect rendering with scanline effects

## Browser Development

The framework runs in modern browsers with:
- ES2020 target compilation
- Module system with hot reload
- Source maps enabled for debugging
- Access game instance via `window.__game` in console

### Development Server
- Run `npm run dev` to start development server on port 3000
- Server automatically opens browser and includes hot reload
- Canvas rendering at 800x600 resolution with dark theme
- Real-time debug info overlay shows FPS, entity count, scheduled tasks, and active tweens

### Console Debugging
- Access the main game instance: `window.__game`
- ECS World available through game instance for entity inspection
- Use browser dev tools with source maps for TypeScript debugging
- Debug info updates in real-time in top-left overlay
