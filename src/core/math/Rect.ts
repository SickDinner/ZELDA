import { Vec2 } from './Vec2.js';

export class Rect {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0
  ) {}

  // Static creation methods
  static zero(): Rect {
    return new Rect(0, 0, 0, 0);
  }

  static fromPositionSize(position: Vec2, size: Vec2): Rect {
    return new Rect(position.x, position.y, size.x, size.y);
  }

  static fromCenterSize(center: Vec2, size: Vec2): Rect {
    return new Rect(
      center.x - size.x / 2,
      center.y - size.y / 2,
      size.x,
      size.y
    );
  }

  static fromMinMax(min: Vec2, max: Vec2): Rect {
    return new Rect(min.x, min.y, max.x - min.x, max.y - min.y);
  }

  // Properties
  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.width;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  get centerX(): number {
    return this.x + this.width / 2;
  }

  get centerY(): number {
    return this.y + this.height / 2;
  }

  get center(): Vec2 {
    return new Vec2(this.centerX, this.centerY);
  }

  get position(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  get size(): Vec2 {
    return new Vec2(this.width, this.height);
  }

  get min(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  get max(): Vec2 {
    return new Vec2(this.x + this.width, this.y + this.height);
  }

  get area(): number {
    return this.width * this.height;
  }

  // Instance methods
  clone(): Rect {
    return new Rect(this.x, this.y, this.width, this.height);
  }

  set(x: number, y: number, width: number, height: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  copy(other: Rect): this {
    this.x = other.x;
    this.y = other.y;
    this.width = other.width;
    this.height = other.height;
    return this;
  }

  setPosition(position: Vec2): this {
    this.x = position.x;
    this.y = position.y;
    return this;
  }

  setSize(size: Vec2): this {
    this.width = size.x;
    this.height = size.y;
    return this;
  }

  setCenter(center: Vec2): this {
    this.x = center.x - this.width / 2;
    this.y = center.y - this.height / 2;
    return this;
  }

  translate(offset: Vec2): this {
    this.x += offset.x;
    this.y += offset.y;
    return this;
  }

  translated(offset: Vec2): Rect {
    return this.clone().translate(offset);
  }

  scale(factor: number): this {
    this.width *= factor;
    this.height *= factor;
    return this;
  }

  scaled(factor: number): Rect {
    return this.clone().scale(factor);
  }

  // Collision and intersection
  contains(point: Vec2): boolean {
    return point.x >= this.x &&
           point.x < this.x + this.width &&
           point.y >= this.y &&
           point.y < this.y + this.height;
  }

  intersects(other: Rect): boolean {
    return !(this.right <= other.x ||
             this.x >= other.right ||
             this.bottom <= other.y ||
             this.y >= other.bottom);
  }

  intersection(other: Rect): Rect | null {
    const left = Math.max(this.x, other.x);
    const top = Math.max(this.y, other.y);
    const right = Math.min(this.right, other.right);
    const bottom = Math.min(this.bottom, other.bottom);

    if (left < right && top < bottom) {
      return new Rect(left, top, right - left, bottom - top);
    }
    return null;
  }

  union(other: Rect): Rect {
    const left = Math.min(this.x, other.x);
    const top = Math.min(this.y, other.y);
    const right = Math.max(this.right, other.right);
    const bottom = Math.max(this.bottom, other.bottom);

    return new Rect(left, top, right - left, bottom - top);
  }

  // Utility methods
  expand(amount: number): this {
    this.x -= amount;
    this.y -= amount;
    this.width += amount * 2;
    this.height += amount * 2;
    return this;
  }

  expanded(amount: number): Rect {
    return this.clone().expand(amount);
  }

  shrink(amount: number): this {
    return this.expand(-amount);
  }

  shrunk(amount: number): Rect {
    return this.clone().shrink(amount);
  }

  floor(): this {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    this.width = Math.floor(this.width);
    this.height = Math.floor(this.height);
    return this;
  }

  floored(): Rect {
    return this.clone().floor();
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.width = Math.round(this.width);
    this.height = Math.round(this.height);
    return this;
  }

  rounded(): Rect {
    return this.clone().round();
  }

  equals(other: Rect, epsilon: number = 0.0001): boolean {
    return Math.abs(this.x - other.x) < epsilon &&
           Math.abs(this.y - other.y) < epsilon &&
           Math.abs(this.width - other.width) < epsilon &&
           Math.abs(this.height - other.height) < epsilon;
  }

  isEmpty(): boolean {
    return this.width <= 0 || this.height <= 0;
  }

  toString(): string {
    return `Rect(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.width.toFixed(2)}, ${this.height.toFixed(2)})`;
  }
}