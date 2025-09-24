import { Vec2 } from '@core/math/Vec2.js';
import { globalTweens, Tween } from '@core/time/Tween.js';

export interface GridPosition {
  x: number;
  y: number;
}

export interface MovementSettings {
  gridSize: number;
  moveSpeed: number; // Duration of movement in seconds
  easeType: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
  allowDiagonal: boolean;
  snapToGrid: boolean;
}

export type MovementDirection = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';

export interface MovementState {
  gridPosition: GridPosition;
  worldPosition: Vec2;
  targetPosition: Vec2;
  isMoving: boolean;
  direction: MovementDirection | null;
  moveProgress: number; // 0.0 to 1.0
}

export class GridMovementController {
  private state: MovementState;
  private settings: MovementSettings;
  private movementTween: Tween | null = null;
  private onMoveComplete?: () => void;
  private onMoveStart?: () => void;

  constructor(
    gridPosition: GridPosition = { x: 0, y: 0 },
    settings: Partial<MovementSettings> = {}
  ) {
    this.settings = {
      gridSize: 32,
      moveSpeed: 0.25,
      easeType: 'easeOut',
      allowDiagonal: false,
      snapToGrid: true,
      ...settings
    };

    this.state = {
      gridPosition: { ...gridPosition },
      worldPosition: this.gridToWorld(gridPosition),
      targetPosition: this.gridToWorld(gridPosition),
      isMoving: false,
      direction: null,
      moveProgress: 0
    };
  }

  /**
   * Convert grid coordinates to world coordinates
   */
  private gridToWorld(gridPos: GridPosition): Vec2 {
    return new Vec2(
      gridPos.x * this.settings.gridSize,
      gridPos.y * this.settings.gridSize
    );
  }

  /**
   * Convert world coordinates to grid coordinates
   */
  private worldToGrid(worldPos: Vec2): GridPosition {
    return {
      x: Math.round(worldPos.x / this.settings.gridSize),
      y: Math.round(worldPos.y / this.settings.gridSize)
    };
  }

  /**
   * Get direction between two grid positions
   */
  private getDirection(from: GridPosition, to: GridPosition): MovementDirection | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (dx === 0 && dy === -1) return 'up';
    if (dx === 0 && dy === 1) return 'down';
    if (dx === -1 && dy === 0) return 'left';
    if (dx === 1 && dy === 0) return 'right';

    if (this.settings.allowDiagonal) {
      if (dx === -1 && dy === -1) return 'up-left';
      if (dx === 1 && dy === -1) return 'up-right';
      if (dx === -1 && dy === 1) return 'down-left';
      if (dx === 1 && dy === 1) return 'down-right';
    }

    return null;
  }

  /**
   * Move to a specific grid position
   */
  public moveTo(targetGrid: GridPosition, onComplete?: () => void): boolean {
    if (this.state.isMoving) {
      return false; // Already moving
    }

    // Check if the move is valid (adjacent or diagonal if allowed)
    const direction = this.getDirection(this.state.gridPosition, targetGrid);
    if (!direction) {
      console.warn(`⚠️ Invalid move from ${this.state.gridPosition.x},${this.state.gridPosition.y} to ${targetGrid.x},${targetGrid.y}`);
      return false;
    }

    this.startMovement(targetGrid, direction, onComplete);
    return true;
  }

  /**
   * Move in a specific direction
   */
  public move(direction: MovementDirection, onComplete?: () => void): boolean {
    if (this.state.isMoving) {
      return false; // Already moving
    }

    const targetGrid = this.getTargetPosition(direction);
    if (!targetGrid) {
      return false;
    }

    this.startMovement(targetGrid, direction, onComplete);
    return true;
  }

  /**
   * Get target position for a direction
   */
  private getTargetPosition(direction: MovementDirection): GridPosition | null {
    const current = this.state.gridPosition;
    
    switch (direction) {
      case 'up': return { x: current.x, y: current.y - 1 };
      case 'down': return { x: current.x, y: current.y + 1 };
      case 'left': return { x: current.x - 1, y: current.y };
      case 'right': return { x: current.x + 1, y: current.y };
      case 'up-left': return this.settings.allowDiagonal ? { x: current.x - 1, y: current.y - 1 } : null;
      case 'up-right': return this.settings.allowDiagonal ? { x: current.x + 1, y: current.y - 1 } : null;
      case 'down-left': return this.settings.allowDiagonal ? { x: current.x - 1, y: current.y + 1 } : null;
      case 'down-right': return this.settings.allowDiagonal ? { x: current.x + 1, y: current.y + 1 } : null;
      default: return null;
    }
  }

  /**
   * Start the movement animation
   */
  private startMovement(
    targetGrid: GridPosition,
    direction: MovementDirection,
    onComplete?: () => void
  ): void {
    const startPosition = this.state.worldPosition.clone();
    const targetPosition = this.gridToWorld(targetGrid);

    this.state.isMoving = true;
    this.state.direction = direction;
    this.state.targetPosition = targetPosition.clone();
    this.state.moveProgress = 0;

    // Trigger movement start callback
    if (this.onMoveStart) {
      this.onMoveStart();
    }

    // Create tween animation using a simple progress object
    const progressObj = { progress: 0 };
    
    this.movementTween = globalTweens.tween(
      progressObj,
      { progress: 1 },
      {
        duration: this.settings.moveSpeed,
        ease: this.getEaseFunction(this.settings.easeType),
        onUpdate: (target: any) => {
          const progress = target.progress;
          this.state.moveProgress = progress;
          
          // Interpolate position
          this.state.worldPosition.x = startPosition.x + (targetPosition.x - startPosition.x) * progress;
          this.state.worldPosition.y = startPosition.y + (targetPosition.y - startPosition.y) * progress;
        },
        onComplete: () => {
          // Snap to final position
          this.state.gridPosition = { ...targetGrid };
          this.state.worldPosition = targetPosition.clone();
          this.state.isMoving = false;
          this.state.direction = null;
          this.state.moveProgress = 1;
          this.movementTween = null;

          // Trigger completion callbacks
          if (this.onMoveComplete) {
            this.onMoveComplete();
          }
          if (onComplete) {
            onComplete();
          }

          console.log(`📍 Moved to grid position: ${targetGrid.x}, ${targetGrid.y}`);
        }
      }
    );
  }

  /**
   * Get easing function based on type
   */
  private getEaseFunction(easeType: string): (t: number) => number {
    switch (easeType) {
      case 'linear':
        return (t: number) => t;
      case 'easeIn':
        return (t: number) => t * t;
      case 'easeOut':
        return (t: number) => t * (2 - t);
      case 'easeInOut':
        return (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'bounce':
        return (t: number) => {
          if (t < 1 / 2.75) {
            return 7.5625 * t * t;
          } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
          } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
          } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
          }
        };
      default:
        return (t: number) => t;
    }
  }

  /**
   * Stop current movement immediately
   */
  public stopMovement(): void {
    if (this.movementTween !== null) {
      this.movementTween.stop();
      this.movementTween = null;
    }

    // Snap to nearest grid position
    if (this.settings.snapToGrid) {
      const nearestGrid = this.worldToGrid(this.state.worldPosition);
      this.state.gridPosition = nearestGrid;
      this.state.worldPosition = this.gridToWorld(nearestGrid);
    }

    this.state.isMoving = false;
    this.state.direction = null;
    this.state.moveProgress = 0;

    console.log('⏹️ Movement stopped');
  }

  /**
   * Teleport to position instantly (no animation)
   */
  public teleportTo(gridPosition: GridPosition): void {
    this.stopMovement();
    
    this.state.gridPosition = { ...gridPosition };
    this.state.worldPosition = this.gridToWorld(gridPosition);
    this.state.targetPosition = this.state.worldPosition.clone();
    
    console.log(`⚡ Teleported to grid position: ${gridPosition.x}, ${gridPosition.y}`);
  }

  /**
   * Set world position (updates grid position accordingly)
   */
  public setWorldPosition(worldPos: Vec2): void {
    this.stopMovement();
    
    this.state.worldPosition = worldPos.clone();
    
    if (this.settings.snapToGrid) {
      this.state.gridPosition = this.worldToGrid(worldPos);
      this.state.worldPosition = this.gridToWorld(this.state.gridPosition);
    } else {
      this.state.gridPosition = this.worldToGrid(worldPos);
    }
    
    this.state.targetPosition = this.state.worldPosition.clone();
  }

  /**
   * Get current state
   */
  public getState(): MovementState {
    return {
      gridPosition: { ...this.state.gridPosition },
      worldPosition: this.state.worldPosition.clone(),
      targetPosition: this.state.targetPosition.clone(),
      isMoving: this.state.isMoving,
      direction: this.state.direction,
      moveProgress: this.state.moveProgress
    };
  }

  /**
   * Get current grid position
   */
  public getGridPosition(): GridPosition {
    return { ...this.state.gridPosition };
  }

  /**
   * Get current world position
   */
  public getWorldPosition(): Vec2 {
    return this.state.worldPosition.clone();
  }

  /**
   * Check if currently moving
   */
  public isMoving(): boolean {
    return this.state.isMoving;
  }

  /**
   * Get current movement direction
   */
  public getCurrentDirection(): MovementDirection | null {
    return this.state.direction;
  }

  /**
   * Set movement settings
   */
  public setSettings(settings: Partial<MovementSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  public getSettings(): MovementSettings {
    return { ...this.settings };
  }

  /**
   * Set movement callbacks
   */
  public setCallbacks(callbacks: {
    onMoveStart?: () => void;
    onMoveComplete?: () => void;
  }): void {
    this.onMoveStart = callbacks.onMoveStart;
    this.onMoveComplete = callbacks.onMoveComplete;
  }

  /**
   * Check if a move in the given direction would be valid
   */
  public canMove(direction: MovementDirection): boolean {
    const targetPos = this.getTargetPosition(direction);
    return targetPos !== null;
  }

  /**
   * Get distance to target in grid units
   */
  public getDistanceToTarget(targetGrid: GridPosition): number {
    const dx = Math.abs(targetGrid.x - this.state.gridPosition.x);
    const dy = Math.abs(targetGrid.y - this.state.gridPosition.y);
    
    if (this.settings.allowDiagonal) {
      // Diagonal distance (Chebyshev distance)
      return Math.max(dx, dy);
    } else {
      // Manhattan distance
      return dx + dy;
    }
  }

  /**
   * Create smooth movement path to target
   */
  public createPath(targetGrid: GridPosition): GridPosition[] {
    const path: GridPosition[] = [];
    const current = { ...this.state.gridPosition };
    
    while (current.x !== targetGrid.x || current.y !== targetGrid.y) {
      const dx = Math.sign(targetGrid.x - current.x);
      const dy = Math.sign(targetGrid.y - current.y);
      
      if (this.settings.allowDiagonal && dx !== 0 && dy !== 0) {
        // Move diagonally when possible
        current.x += dx;
        current.y += dy;
      } else if (Math.abs(targetGrid.x - current.x) > Math.abs(targetGrid.y - current.y)) {
        // Move horizontally first
        current.x += dx;
      } else {
        // Move vertically first
        current.y += dy;
      }
      
      path.push({ ...current });
    }
    
    return path;
  }
}