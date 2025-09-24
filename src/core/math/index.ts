export { Vec2 } from './Vec2.js';
export { Rect } from './Rect.js';
export { 
  RNG, 
  globalRNG, 
  randomInt, 
  randomFloat, 
  randomBool, 
  randomChoose, 
  randomShuffle, 
  randomWeighted 
} from './RNG.js';

// Common math utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const smoothstep = (min: number, max: number, value: number): number => {
  const t = clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
};

export const radToDeg = (radians: number): number => {
  return radians * 180 / Math.PI;
};

export const degToRad = (degrees: number): number => {
  return degrees * Math.PI / 180;
};

export const wrap = (value: number, min: number, max: number): number => {
  const range = max - min;
  return ((value - min) % range + range) % range + min;
};

export const approach = (current: number, target: number, delta: number): number => {
  if (Math.abs(target - current) <= delta) {
    return target;
  }
  return current + Math.sign(target - current) * delta;
};

export const sign = (value: number): number => {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
};