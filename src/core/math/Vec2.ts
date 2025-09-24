export class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  // Static creation methods
  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  static one(): Vec2 {
    return new Vec2(1, 1);
  }

  static up(): Vec2 {
    return new Vec2(0, -1);
  }

  static down(): Vec2 {
    return new Vec2(0, 1);
  }

  static left(): Vec2 {
    return new Vec2(-1, 0);
  }

  static right(): Vec2 {
    return new Vec2(1, 0);
  }

  static fromAngle(angle: number, length: number = 1): Vec2 {
    return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  // Instance methods
  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(other: Vec2): this {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  add(other: Vec2): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  subtract(other: Vec2): this {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  multiply(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divide(scalar: number): this {
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  // Non-mutating operations
  plus(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  minus(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  times(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  dividedBy(scalar: number): Vec2 {
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  // Geometric operations
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): this {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  normalized(): Vec2 {
    return this.clone().normalize();
  }

  distance(other: Vec2): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distanceSquared(other: Vec2): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }

  dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y;
  }

  cross(other: Vec2): number {
    return this.x * other.y - this.y * other.x;
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(other: Vec2): number {
    return Math.atan2(other.y - this.y, other.x - this.x);
  }

  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  rotated(angle: number): Vec2 {
    return this.clone().rotate(angle);
  }

  // Utility methods
  floor(): this {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    return this;
  }

  floored(): Vec2 {
    return new Vec2(Math.floor(this.x), Math.floor(this.y));
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }

  rounded(): Vec2 {
    return new Vec2(Math.round(this.x), Math.round(this.y));
  }

  lerp(other: Vec2, t: number): this {
    this.x += (other.x - this.x) * t;
    this.y += (other.y - this.y) * t;
    return this;
  }

  lerped(other: Vec2, t: number): Vec2 {
    return this.clone().lerp(other, t);
  }

  equals(other: Vec2, epsilon: number = 0.0001): boolean {
    return Math.abs(this.x - other.x) < epsilon && Math.abs(this.y - other.y) < epsilon;
  }

  toString(): string {
    return `Vec2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}