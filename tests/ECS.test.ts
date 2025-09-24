import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '@core/ecs/World.js';
import { Entity } from '@core/ecs/Entity.js';
import { ComponentRegistry } from '@core/ecs/Component.js';

// Simple test component for testing
class TestComponent {
  readonly __componentType!: string;
  constructor(public value: number = 0) {}
}

class AnotherComponent {
  readonly __componentType!: string;
  constructor(public name: string = 'test') {}
}

// Register components manually
ComponentRegistry.register('TestComponent', TestComponent);
ComponentRegistry.register('AnotherComponent', AnotherComponent);

describe('ECS System', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe('World', () => {
    it('should create and manage entities', () => {
      const entity = world.createEntity();
      expect(entity).toBeInstanceOf(Entity);
      expect(entity.id).toBeDefined();
      expect(world.getEntityCount()).toBe(1);
    });

    it('should destroy entities', () => {
      const entity = world.createEntity();
      const entityId = entity.id;
      
      world.removeEntity(entityId);
      expect(world.getEntityCount()).toBe(0);
    });

    it('should add and retrieve components', () => {
      const entity = world.createEntity();
      const testComp = new TestComponent(42);
      
      world.addComponent(entity.id, testComp);
      
      const retrieved = world.getComponent(entity.id, TestComponent);
      expect(retrieved).toBe(testComp);
      expect(retrieved?.value).toBe(42);
    });

    it('should remove components', () => {
      const entity = world.createEntity();
      const testComp = new TestComponent();
      
      world.addComponent(entity.id, testComp);
      expect(world.hasComponent(entity.id, TestComponent)).toBe(true);
      
      world.removeComponent(entity.id, TestComponent);
      expect(world.hasComponent(entity.id, TestComponent)).toBe(false);
    });

    it('should check if entity has component', () => {
      const entity = world.createEntity();
      const testComp = new TestComponent();
      
      expect(world.hasComponent(entity.id, TestComponent)).toBe(false);
      
      world.addComponent(entity.id, testComp);
      expect(world.hasComponent(entity.id, TestComponent)).toBe(true);
    });

    it('should get component counts', () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      
      world.addComponent(entity1.id, new TestComponent());
      world.addComponent(entity1.id, new AnotherComponent('test'));
      world.addComponent(entity2.id, new TestComponent());
      
      const counts = world.getComponentCounts();
      expect(counts.TestComponent).toBe(2);
      expect(counts.AnotherComponent).toBe(1);
    });
  });

  describe('Basic Queries', () => {
    beforeEach(() => {
      // Create test entities
      const entity1 = world.createEntity();
      world.addComponent(entity1.id, new TestComponent(10));
      world.addComponent(entity1.id, new AnotherComponent('entity1'));

      const entity2 = world.createEntity();
      world.addComponent(entity2.id, new TestComponent(20));

      const entity3 = world.createEntity();
      world.addComponent(entity3.id, new TestComponent(30));
      world.addComponent(entity3.id, new AnotherComponent('entity3'));
    });

    it('should query entities with specific components', () => {
      const query = world.createQuery().with(TestComponent);
      const results = query.execute();
      expect(results.length).toBe(3); // All entities have TestComponent
    });

    it('should query entities with multiple components', () => {
      const query = world.createQuery().with(TestComponent).with(AnotherComponent);
      const results = query.execute();
      expect(results.length).toBe(2); // entity1 and entity3 have both
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle component lifecycle correctly', () => {
      const entity = world.createEntity();
      const testComp = new TestComponent(10);
      
      // Add component
      world.addComponent(entity.id, testComp);
      expect(world.getComponent(entity.id, TestComponent)).toBe(testComp);
      
      // Update component (should be the same instance)
      const retrieved = world.getComponent(entity.id, TestComponent);
      if (retrieved) retrieved.value = 30;
      
      const retrievedAgain = world.getComponent(entity.id, TestComponent);
      expect(retrievedAgain?.value).toBe(30);
      
      // Remove component
      world.removeComponent(entity.id, TestComponent);
      expect(world.getComponent(entity.id, TestComponent)).toBeUndefined();
    });

    it('should handle entity destruction with components', () => {
      const entity = world.createEntity();
      world.addComponent(entity.id, new TestComponent());
      world.addComponent(entity.id, new AnotherComponent());
      
      expect(world.getEntityCount()).toBe(1);
      const counts = world.getComponentCounts();
      expect(counts.TestComponent).toBe(1);
      expect(counts.AnotherComponent).toBe(1);
      
      world.removeEntity(entity.id);
      
      expect(world.getEntityCount()).toBe(0);
      const countsAfter = world.getComponentCounts();
      expect(countsAfter.TestComponent || 0).toBe(0);
      expect(countsAfter.AnotherComponent || 0).toBe(0);
    });
  });
});