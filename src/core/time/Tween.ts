import { lerp } from '../math/index.js';

// Easing functions
export type EaseFunction = (t: number) => number;

export const Easing = {
  linear: (t: number): number => t,
  
  quadIn: (t: number): number => t * t,
  quadOut: (t: number): number => t * (2 - t),
  quadInOut: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  cubicIn: (t: number): number => t * t * t,
  cubicOut: (t: number): number => (--t) * t * t + 1,
  cubicInOut: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  quartIn: (t: number): number => t * t * t * t,
  quartOut: (t: number): number => 1 - (--t) * t * t * t,
  quartInOut: (t: number): number => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  
  sineIn: (t: number): number => 1 - Math.cos(t * Math.PI / 2),
  sineOut: (t: number): number => Math.sin(t * Math.PI / 2),
  sineInOut: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,
  
  bounceOut: (t: number): number => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  
  bounceIn: (t: number): number => 1 - Easing.bounceOut(1 - t),
  
  bounceInOut: (t: number): number => t < 0.5 
    ? Easing.bounceIn(t * 2) * 0.5 
    : Easing.bounceOut(t * 2 - 1) * 0.5 + 0.5
};

export interface TweenTarget {
  [key: string]: number;
}

export interface TweenOptions {
  duration: number;
  ease?: EaseFunction;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onUpdate?: (target: TweenTarget, progress: number) => void;
  onComplete?: () => void;
}

export class Tween {
  private target: TweenTarget;
  private startValues: TweenTarget = {};
  private endValues: TweenTarget;
  private options: Required<TweenOptions>;
  
  private elapsed: number = 0;
  private delayElapsed: number = 0;
  private isStarted: boolean = false;
  private isCompleted: boolean = false;
  private currentRepeat: number = 0;
  private isYoyoReverse: boolean = false;
  
  constructor(target: TweenTarget, endValues: TweenTarget, options: TweenOptions) {
    this.target = target;
    this.endValues = endValues;
    this.options = {
      duration: options.duration,
      ease: options.ease || Easing.linear,
      delay: options.delay || 0,
      repeat: options.repeat || 0,
      yoyo: options.yoyo || false,
      onStart: options.onStart || (() => {}),
      onUpdate: options.onUpdate || (() => {}),
      onComplete: options.onComplete || (() => {})
    };
  }

  public update(dt: number): boolean {
    if (this.isCompleted) return false;
    
    // Handle delay
    if (this.delayElapsed < this.options.delay) {
      this.delayElapsed += dt;
      return true;
    }
    
    // Initialize start values on first update after delay
    if (!this.isStarted) {
      this.start();
    }
    
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.options.duration, 1);
    
    this.updateValues(progress);
    
    if (progress >= 1) {
      this.handleCompletion();
    }
    
    return !this.isCompleted;
  }
  
  private start(): void {
    this.isStarted = true;
    
    // Store initial values
    for (const key in this.endValues) {
      this.startValues[key] = this.target[key] || 0;
    }
    
    this.options.onStart();
  }
  
  private updateValues(progress: number): void {
    const easedProgress = this.options.ease(progress);
    
    for (const key in this.endValues) {
      const start = this.isYoyoReverse ? this.endValues[key] : this.startValues[key];
      const end = this.isYoyoReverse ? this.startValues[key] : this.endValues[key];
      this.target[key] = lerp(start, end, easedProgress);
    }
    
    this.options.onUpdate(this.target, progress);
  }
  
  private handleCompletion(): void {
    if (this.currentRepeat < this.options.repeat) {
      this.currentRepeat++;
      this.elapsed = 0;
      
      if (this.options.yoyo) {
        this.isYoyoReverse = !this.isYoyoReverse;
      }
    } else {
      this.isCompleted = true;
      this.options.onComplete();
    }
  }
  
  public stop(): void {
    this.isCompleted = true;
  }
  
  public pause(): void {
    // Pausing is handled by not calling update()
  }
  
  public getProgress(): number {
    if (!this.isStarted) return 0;
    return Math.min(this.elapsed / this.options.duration, 1);
  }
  
  public isComplete(): boolean {
    return this.isCompleted;
  }
}

export class TweenManager {
  private tweens: Set<Tween> = new Set();
  
  public update(dt: number): void {
    for (const tween of this.tweens) {
      const isActive = tween.update(dt);
      if (!isActive) {
        this.tweens.delete(tween);
      }
    }
  }
  
  public tween(target: TweenTarget, values: TweenTarget, options: TweenOptions): Tween {
    const tween = new Tween(target, values, options);
    this.tweens.add(tween);
    return tween;
  }
  
  public killTweensOf(target: TweenTarget): void {
    for (const tween of this.tweens) {
      if ((tween as any).target === target) {
        tween.stop();
        this.tweens.delete(tween);
      }
    }
  }
  
  public killAll(): void {
    for (const tween of this.tweens) {
      tween.stop();
    }
    this.tweens.clear();
  }
  
  public getTweenCount(): number {
    return this.tweens.size;
  }
}

// Global tween manager
export const globalTweens = new TweenManager();