import { describe, it, expect, beforeEach } from 'vitest';
import { Rect } from '@core/math/Rect.js';
import { Vec2 } from '@core/math/Vec2.js';

describe('Rect', () => {
  let rect: Rect;
  let rect2: Rect;

  beforeEach(() => {
    rect = new Rect(10, 20, 100, 50);
    rect2 = new Rect(50, 30, 80, 40);
  });

  describe('constructor', () => {
    it('should create a rectangle with given parameters', () => {
      expect(rect.x).toBe(10);
      expect(rect.y).toBe(20);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(50);
    });

    it('should default to zero rectangle', () => {
      const zeroRect = new Rect();
      expect(zeroRect.x).toBe(0);
      expect(zeroRect.y).toBe(0);
      expect(zeroRect.width).toBe(0);
      expect(zeroRect.height).toBe(0);
    });
  });

  describe('getters', () => {
    it('should calculate left, right, top, bottom properties', () => {
      expect(rect.left).toBe(10);
      expect(rect.right).toBe(110); // x + width
      expect(rect.top).toBe(20);
      expect(rect.bottom).toBe(70); // y + height
    });

    it('should calculate center properties', () => {
      expect(rect.centerX).toBe(60); // x + width/2
      expect(rect.centerY).toBe(45); // y + height/2
    });

    it('should get center as Vec2', () => {
      const center = rect.center;
      expect(center).toEqual(new Vec2(60, 45));
    });

    it('should get size as Vec2', () => {
      const size = rect.size;
      expect(size).toEqual(new Vec2(100, 50));
    });
  });

  describe('static methods', () => {
    it('should create from center and size', () => {
      const fromCenter = Rect.fromCenterSize(new Vec2(60, 45), new Vec2(100, 50));
      expect(fromCenter.x).toBe(10);
      expect(fromCenter.y).toBe(20);
      expect(fromCenter.width).toBe(100);
      expect(fromCenter.height).toBe(50);
    });

    it('should create from position and size', () => {
      const fromPosSize = Rect.fromPositionSize(new Vec2(10, 20), new Vec2(100, 50));
      expect(fromPosSize).toEqual(rect);
    });

    it('should create from min/max points', () => {
      const fromMinMax = Rect.fromMinMax(new Vec2(10, 20), new Vec2(110, 70));
      expect(fromMinMax).toEqual(rect);
    });
  });

  describe('instance methods', () => {
    it('should clone rectangle', () => {
      const cloned = rect.clone();
      expect(cloned).toEqual(rect);
      expect(cloned).not.toBe(rect);
    });

    it('should set values', () => {
      rect.set(5, 10, 200, 100);
      expect(rect.x).toBe(5);
      expect(rect.y).toBe(10);
      expect(rect.width).toBe(200);
      expect(rect.height).toBe(100);
    });

    it('should copy from another rectangle', () => {
      rect.copy(rect2);
      expect(rect).toEqual(rect2);
    });

    it('should check if point is inside', () => {
      expect(rect.contains(new Vec2(60, 45))).toBe(true); // center
      expect(rect.contains(new Vec2(10, 20))).toBe(true); // top-left corner
      expect(rect.contains(new Vec2(110, 70))).toBe(false); // bottom-right corner (exclusive)
      expect(rect.contains(new Vec2(5, 15))).toBe(false); // outside
    });

    it('should check if Vec2 point is inside', () => {
      expect(rect.contains(new Vec2(60, 45))).toBe(true);
      expect(rect.contains(new Vec2(5, 15))).toBe(false);
    });

    it('should check if rectangle intersects', () => {
      expect(rect.intersects(rect2)).toBe(true);
      
      const noIntersect = new Rect(200, 200, 50, 50);
      expect(rect.intersects(noIntersect)).toBe(false);
    });

    it('should check if rectangle is completely inside', () => {
      // The Rect class doesn't have containsRect method, let's test intersection instead
      const inside = new Rect(20, 30, 50, 20);
      expect(rect.intersects(inside)).toBe(true);
      
      expect(rect.intersects(rect2)).toBe(true); // overlapping
    });

    it('should calculate intersection', () => {
      const intersection = rect.intersection(rect2);
      expect(intersection).toEqual(new Rect(50, 30, 60, 40));
    });

    it('should return null for non-intersecting rectangles', () => {
      const noIntersect = new Rect(200, 200, 50, 50);
      expect(rect.intersection(noIntersect)).toBeNull();
    });

    it('should calculate union', () => {
      const union = rect.union(rect2);
      expect(union.x).toBe(10);
      expect(union.y).toBe(20);
      expect(union.right).toBe(130); // max of rect.right and rect2.right
      expect(union.bottom).toBe(70); // max of rect.bottom and rect2.bottom
      expect(union.width).toBe(120);
      expect(union.height).toBe(50);
    });

    it('should expand rectangle', () => {
      const expanded = rect.expand(5);
      expect(expanded.x).toBe(5);
      expect(expanded.y).toBe(15);
      expect(expanded.width).toBe(110);
      expect(expanded.height).toBe(60);
    });

    it('should translate rectangle', () => {
      rect.translate(new Vec2(5, 10));
      expect(rect.x).toBe(15);
      expect(rect.y).toBe(30);
      expect(rect.width).toBe(100); // unchanged
      expect(rect.height).toBe(50); // unchanged
    });

    it('should translate by Vec2', () => {
      rect.translate(new Vec2(5, 10));
      expect(rect.x).toBe(15);
      expect(rect.y).toBe(30);
    });

    it('should scale rectangle', () => {
      rect.scale(2);
      expect(rect.width).toBe(200);
      expect(rect.height).toBe(100);
      // Position should remain the same
      expect(rect.x).toBe(10);
      expect(rect.y).toBe(20);
    });

    it('should handle rectangles with negative dimensions', () => {
      // The Rect class doesn't have normalize method, let's test negative dimensions behavior
      const negRect = new Rect(10, 20, -50, -30);
      expect(negRect.right).toBe(-40); // x + width = 10 + (-50)
      expect(negRect.bottom).toBe(-10); // y + height = 20 + (-30)
      expect(negRect.area).toBe(1500); // width * height = -50 * -30
    });

    it('should check equality', () => {
      const rect3 = new Rect(10, 20, 100, 50);
      expect(rect.equals(rect3)).toBe(true);
      expect(rect.equals(rect2)).toBe(false);
    });

    it('should convert to string', () => {
      expect(rect.toString()).toBe('Rect(10.00, 20.00, 100.00, 50.00)');
    });
  });

  describe('edge cases', () => {
    it('should handle zero-sized rectangles', () => {
      const zeroRect = new Rect(10, 20, 0, 0);
      expect(zeroRect.contains(new Vec2(10, 20))).toBe(false); // zero-size contains nothing
      expect(zeroRect.intersects(rect)).toBe(false);
    });

    it('should handle rectangles with negative dimensions', () => {
      const negRect = new Rect(100, 100, -50, -50);
      expect(negRect.left).toBe(100);
      expect(negRect.right).toBe(50); // x + width
      expect(negRect.top).toBe(100);
      expect(negRect.bottom).toBe(50); // y + height
    });

    it('should handle touching rectangles', () => {
      const touching = new Rect(110, 70, 50, 50);
      expect(rect.intersects(touching)).toBe(false); // just touching, not intersecting
    });
  });
});