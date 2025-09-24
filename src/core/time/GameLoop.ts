export interface GameLoopCallbacks {
  update: (dt: number) => void;
  render: (interpolation: number) => void;
}

export class GameLoop {
  private callbacks: GameLoopCallbacks;
  private isRunning: boolean = false;
  private animationFrameId?: number;
  
  // Fixed timestep configuration
  private readonly targetFPS: number;
  private readonly targetDelta: number;
  private readonly maxFrameTime: number;
  
  // Timing state
  private lastTime: number = 0;
  private accumulator: number = 0;
  
  // Performance tracking
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private currentFPS: number = 0;

  constructor(callbacks: GameLoopCallbacks, targetFPS: number = 60) {
    this.callbacks = callbacks;
    this.targetFPS = targetFPS;
    this.targetDelta = 1000 / targetFPS; // milliseconds per frame
    this.maxFrameTime = this.targetDelta * 5; // Cap at 5 frames to prevent spiral of death
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    
    this.loop();
  }

  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  public getFPS(): number {
    return this.currentFPS;
  }

  public getTargetFPS(): number {
    return this.targetFPS;
  }

  private loop = (): void => {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Cap frame time to prevent spiral of death
    if (deltaTime > this.maxFrameTime) {
      deltaTime = this.maxFrameTime;
    }
    
    this.accumulator += deltaTime;
    
    // Fixed timestep updates
    while (this.accumulator >= this.targetDelta) {
      this.callbacks.update(this.targetDelta / 1000); // Convert to seconds
      this.accumulator -= this.targetDelta;
    }
    
    // Interpolation for smooth rendering
    const interpolation = this.accumulator / this.targetDelta;
    this.callbacks.render(interpolation);
    
    // FPS tracking
    this.updateFPS(deltaTime);
    
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private updateFPS(deltaTime: number): void {
    this.frameCount++;
    this.fpsTimer += deltaTime;
    
    if (this.fpsTimer >= 1000) { // Update FPS every second
      this.currentFPS = Math.round((this.frameCount * 1000) / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }
}