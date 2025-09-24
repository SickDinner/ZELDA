import { Vec2 } from '@core/math/Vec2.js';

export interface AnimationFrame {
  frameId: string;
  duration: number; // Duration in seconds
  offset?: Vec2; // Optional position offset for this frame
  events?: string[]; // Events to trigger when this frame starts
}

export interface AnimationClip {
  name: string;
  frames: AnimationFrame[];
  loop: boolean;
  speed: number; // Speed multiplier (1.0 = normal speed)
  pingPong: boolean; // If true, reverse direction at end
}

export interface AnimationState {
  currentClip: string;
  currentFrame: number;
  frameTime: number; // Time spent on current frame
  isPlaying: boolean;
  isPaused: boolean;
  direction: number; // 1 for forward, -1 for reverse (used with pingPong)
  speed: number; // Current speed multiplier
}

export type AnimationEvent = {
  clipName: string;
  frameName: string;
  eventName: string;
};

export class AnimationController {
  private clips = new Map<string, AnimationClip>();
  private state: AnimationState;
  private eventCallbacks = new Map<string, ((event: AnimationEvent) => void)[]>();

  constructor() {
    this.state = {
      currentClip: '',
      currentFrame: 0,
      frameTime: 0,
      isPlaying: false,
      isPaused: false,
      direction: 1,
      speed: 1.0
    };
  }

  /**
   * Add an animation clip
   */
  public addClip(clip: AnimationClip): void {
    this.clips.set(clip.name, clip);
    
    // If this is the first clip and no clip is set, set it as current
    if (this.state.currentClip === '' && clip.frames.length > 0) {
      this.state.currentClip = clip.name;
    }
    
    console.log(`🎬 Added animation clip: ${clip.name} (${clip.frames.length} frames)`);
  }

  /**
   * Create a simple animation clip from frame IDs
   */
  public createClip(
    name: string,
    frameIds: string[],
    frameDuration: number = 0.1,
    options: {
      loop?: boolean;
      speed?: number;
      pingPong?: boolean;
    } = {}
  ): AnimationClip {
    const frames: AnimationFrame[] = frameIds.map(frameId => ({
      frameId,
      duration: frameDuration,
      events: []
    }));

    const clip: AnimationClip = {
      name,
      frames,
      loop: options.loop !== undefined ? options.loop : true,
      speed: options.speed || 1.0,
      pingPong: options.pingPong || false
    };

    this.addClip(clip);
    return clip;
  }

  /**
   * Play an animation clip
   */
  public play(clipName: string, resetToStart: boolean = true): boolean {
    const clip = this.clips.get(clipName);
    if (!clip) {
      console.warn(`⚠️ Animation clip not found: ${clipName}`);
      return false;
    }

    this.state.currentClip = clipName;
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.state.direction = 1;
    this.state.speed = clip.speed;

    if (resetToStart) {
      this.state.currentFrame = 0;
      this.state.frameTime = 0;
    }

    console.log(`▶️ Playing animation: ${clipName}`);
    return true;
  }

  /**
   * Stop animation
   */
  public stop(): void {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.currentFrame = 0;
    this.state.frameTime = 0;
    console.log('⏹️ Animation stopped');
  }

  /**
   * Pause animation
   */
  public pause(): void {
    this.state.isPaused = true;
    console.log('⏸️ Animation paused');
  }

  /**
   * Resume animation
   */
  public resume(): void {
    this.state.isPaused = false;
    console.log('▶️ Animation resumed');
  }

  /**
   * Set animation speed
   */
  public setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, speed);
  }

  /**
   * Update animation state
   */
  public update(deltaTime: number): void {
    if (!this.state.isPlaying || this.state.isPaused) {
      return;
    }

    const clip = this.clips.get(this.state.currentClip);
    if (!clip || clip.frames.length === 0) {
      return;
    }

    // Update frame time
    this.state.frameTime += deltaTime * this.state.speed;

    const currentFrame = clip.frames[this.state.currentFrame];
    if (!currentFrame) return;

    // Check if it's time to advance to the next frame
    if (this.state.frameTime >= currentFrame.duration) {
      this.advanceFrame();
    }
  }

  /**
   * Advance to the next frame
   */
  private advanceFrame(): void {
    const clip = this.clips.get(this.state.currentClip);
    if (!clip) return;

    const currentFrame = clip.frames[this.state.currentFrame];
    
    // Trigger frame events
    if (currentFrame.events) {
      currentFrame.events.forEach(eventName => {
        this.triggerEvent(clip.name, currentFrame.frameId, eventName);
      });
    }

    this.state.frameTime = 0;

    if (clip.pingPong) {
      // Ping-pong animation logic
      const nextFrame = this.state.currentFrame + this.state.direction;
      
      if (nextFrame >= clip.frames.length) {
        if (clip.loop) {
          this.state.direction = -1;
          this.state.currentFrame = clip.frames.length - 2;
        } else {
          this.state.isPlaying = false;
          this.triggerEvent(clip.name, 'animation', 'complete');
        }
      } else if (nextFrame < 0) {
        if (clip.loop) {
          this.state.direction = 1;
          this.state.currentFrame = 1;
        } else {
          this.state.isPlaying = false;
          this.triggerEvent(clip.name, 'animation', 'complete');
        }
      } else {
        this.state.currentFrame = nextFrame;
      }
    } else {
      // Normal animation logic
      this.state.currentFrame++;
      
      if (this.state.currentFrame >= clip.frames.length) {
        if (clip.loop) {
          this.state.currentFrame = 0;
        } else {
          this.state.currentFrame = clip.frames.length - 1;
          this.state.isPlaying = false;
          this.triggerEvent(clip.name, 'animation', 'complete');
        }
      }
    }
  }

  /**
   * Get the current frame ID
   */
  public getCurrentFrameId(): string {
    const clip = this.clips.get(this.state.currentClip);
    if (!clip || !clip.frames[this.state.currentFrame]) {
      return '';
    }
    
    return clip.frames[this.state.currentFrame].frameId;
  }

  /**
   * Get the current frame with offset
   */
  public getCurrentFrame(): { frameId: string; offset?: Vec2 } {
    const clip = this.clips.get(this.state.currentClip);
    if (!clip || !clip.frames[this.state.currentFrame]) {
      return { frameId: '' };
    }
    
    const frame = clip.frames[this.state.currentFrame];
    return {
      frameId: frame.frameId,
      offset: frame.offset
    };
  }

  /**
   * Get animation progress (0.0 to 1.0)
   */
  public getProgress(): number {
    const clip = this.clips.get(this.state.currentClip);
    if (!clip || clip.frames.length === 0) {
      return 0;
    }

    if (clip.loop) {
      // For looping animations, progress cycles
      const frameProgress = this.state.frameTime / clip.frames[this.state.currentFrame]?.duration || 0;
      return (this.state.currentFrame + frameProgress) / clip.frames.length;
    } else {
      // For non-looping animations, progress goes from 0 to 1
      const totalFrames = clip.frames.length;
      const frameProgress = this.state.frameTime / clip.frames[this.state.currentFrame]?.duration || 0;
      return Math.min(1, (this.state.currentFrame + frameProgress) / totalFrames);
    }
  }

  /**
   * Check if animation is playing
   */
  public isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * Check if animation is paused
   */
  public isPaused(): boolean {
    return this.state.isPaused;
  }

  /**
   * Get current animation state
   */
  public getState(): AnimationState {
    return { ...this.state };
  }

  /**
   * Get available animation clips
   */
  public getClipNames(): string[] {
    return Array.from(this.clips.keys());
  }

  /**
   * Check if a clip exists
   */
  public hasClip(clipName: string): boolean {
    return this.clips.has(clipName);
  }

  /**
   * Add event listener for animation events
   */
  public addEventListener(eventName: string, callback: (event: AnimationEvent) => void): void {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, []);
    }
    this.eventCallbacks.get(eventName)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(eventName: string, callback: (event: AnimationEvent) => void): void {
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Trigger an animation event
   */
  private triggerEvent(clipName: string, frameName: string, eventName: string): void {
    const event: AnimationEvent = {
      clipName,
      frameName,
      eventName
    };

    // Trigger specific event listeners
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in animation event callback for ${eventName}:`, error);
        }
      });
    }

    // Trigger global event listeners
    const globalCallbacks = this.eventCallbacks.get('*');
    if (globalCallbacks) {
      globalCallbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in global animation event callback:`, error);
        }
      });
    }
  }

  /**
   * Set frame at specific index
   */
  public setFrame(frameIndex: number): boolean {
    const clip = this.clips.get(this.state.currentClip);
    if (!clip || frameIndex < 0 || frameIndex >= clip.frames.length) {
      return false;
    }

    this.state.currentFrame = frameIndex;
    this.state.frameTime = 0;
    return true;
  }

  /**
   * Create complex animation with different frame durations
   */
  public createComplexClip(
    name: string,
    frameData: Array<{
      frameId: string;
      duration: number;
      offset?: Vec2;
      events?: string[];
    }>,
    options: {
      loop?: boolean;
      speed?: number;
      pingPong?: boolean;
    } = {}
  ): AnimationClip {
    const frames: AnimationFrame[] = frameData.map(data => ({
      frameId: data.frameId,
      duration: data.duration,
      offset: data.offset,
      events: data.events || []
    }));

    const clip: AnimationClip = {
      name,
      frames,
      loop: options.loop !== undefined ? options.loop : true,
      speed: options.speed || 1.0,
      pingPong: options.pingPong || false
    };

    this.addClip(clip);
    return clip;
  }

  /**
   * Blend between two animations (for smooth transitions)
   */
  public blendTo(
    targetClip: string, 
    blendTime: number = 0.3,
    callback?: () => void
  ): void {
    // Simple implementation - just switch after a delay
    // A more complex implementation would interpolate between frames
    setTimeout(() => {
      this.play(targetClip);
      if (callback) callback();
    }, blendTime * 1000);
  }
}