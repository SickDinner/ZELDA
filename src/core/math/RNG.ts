// Simple seeded random number generator using LCG algorithm
// Provides deterministic random numbers for game logic
export class RNG {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed;
  }

  // Generate next random number (0 to 1)
  next(): number {
    // Linear Congruential Generator parameters (from Numerical Recipes)
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  // Random integer between min and max (inclusive)
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Random float between min and max
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  // Random boolean with given probability (0-1)
  bool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  // Choose random element from array
  choose<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[this.int(0, array.length - 1)];
  }

  // Shuffle array in place (Fisher-Yates)
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Weighted random selection
  weighted<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights arrays must have same length');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = this.next() * totalWeight;
    
    let currentWeight = 0;
    for (let i = 0; i < items.length; i++) {
      currentWeight += weights[i];
      if (random < currentWeight) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  // Normal distribution (Box-Muller transform)
  normal(mean: number = 0, stdDev: number = 1): number {
    if (!this.spareNormal) {
      const u = this.next();
      const v = this.next();
      const z0 = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      const z1 = Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v);
      this.spareNormal = z1;
      return z0 * stdDev + mean;
    } else {
      const result = this.spareNormal * stdDev + mean;
      this.spareNormal = undefined;
      return result;
    }
  }
  
  private spareNormal?: number;

  // Reset with new seed
  seed(newSeed: number): void {
    this.state = newSeed;
    this.spareNormal = undefined;
  }

  // Get current state (for saving/loading)
  getState(): number {
    return this.state;
  }

  // Restore state
  setState(state: number): void {
    this.state = state;
    this.spareNormal = undefined;
  }
}

// Global RNG instance
export const globalRNG = new RNG();

// Utility functions using global RNG
export const randomInt = (min: number, max: number): number => globalRNG.int(min, max);
export const randomFloat = (min: number, max: number): number => globalRNG.float(min, max);
export const randomBool = (probability?: number): boolean => globalRNG.bool(probability);
export const randomChoose = <T>(array: T[]): T => globalRNG.choose(array);
export const randomShuffle = <T>(array: T[]): T[] => globalRNG.shuffle(array);
export const randomWeighted = <T>(items: T[], weights: number[]): T => globalRNG.weighted(items, weights);