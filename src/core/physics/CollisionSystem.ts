import { World } from '../ecs/World';
import { Transform, Collider } from '../ecs/components/CoreComponents';
import { Vec2 } from '../math/Vec2';
import { Rect } from '../math/Rect';

/**
 * Collision shape types (for future expansion)
 */
export enum CollisionShape {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle'
}

/**
 * Collision event data
 */
export interface CollisionEvent {
  entityA: number;
  entityB: number;
  colliderA: Collider;
  colliderB: Collider;
  point: Vec2;
  normal: Vec2;
  penetration: number;
  timestamp: number;
}

/**
 * Collision callback function type
 */
export type CollisionCallback = (event: CollisionEvent) => void;

// Using the enhanced Collider component from CoreComponents

/**
 * Collision layer utility functions and constants
 */
export class CollisionLayers {
  static readonly PLAYER = 1;
  static readonly NPC = 2;
  static readonly ENEMY = 4;
  static readonly ENVIRONMENT = 8;
  static readonly PROJECTILE = 16;
  static readonly PICKUP = 32;
  static readonly TRIGGER = 64;
  static readonly WALL = 128;
  
  /**
   * Create a collision mask from multiple layers
   */
  static createMask(...layers: number[]): number {
    return layers.reduce((mask, layer) => mask | layer, 0);
  }
  
  /**
   * Check if a mask includes a specific layer
   */
  static includesLayer(mask: number, layer: number): boolean {
    return (mask & layer) !== 0;
  }
}

/**
 * Spatial grid for broad-phase collision detection optimization
 */
class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, number[]> = new Map();

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  /**
   * Clear the grid
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Add entity to grid
   */
  add(entityId: number, bounds: Rect): void {
    const cells = this.getCellsForBounds(bounds);
    for (const cellKey of cells) {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      this.grid.get(cellKey)!.push(entityId);
    }
  }

  /**
   * Get potential collision candidates for a bounds
   */
  query(bounds: Rect): Set<number> {
    const candidates = new Set<number>();
    const cells = this.getCellsForBounds(bounds);
    
    for (const cellKey of cells) {
      const entities = this.grid.get(cellKey);
      if (entities) {
        for (const entityId of entities) {
          candidates.add(entityId);
        }
      }
    }
    
    return candidates;
  }

  /**
   * Get grid cells that a bounds overlaps
   */
  private getCellsForBounds(bounds: Rect): string[] {
    const cells: string[] = [];
    
    const minX = Math.floor(bounds.x / this.cellSize);
    const minY = Math.floor(bounds.y / this.cellSize);
    const maxX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const maxY = Math.floor((bounds.y + bounds.height) / this.cellSize);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.push(`${x},${y}`);
      }
    }
    
    return cells;
  }
}

/**
 * Main collision detection and response system
 */
export class CollisionSystem {
  private world: World;
  private spatialGrid: SpatialGrid;
  private collisionEvents: CollisionEvent[] = [];
  private frameCount: number = 0;
  private query: any; // Query for entities with colliders

  constructor(world: World, cellSize: number = 64) {
    this.world = world;
    this.spatialGrid = new SpatialGrid(cellSize);
    // Create query for entities with colliders
    this.query = this.world.createQuery().with(Collider);
  }

  /**
   * Update collision system
   */
  update(_deltaTime: number): void {
    this.frameCount++;
    
    // Clear previous frame data
    this.spatialGrid.clear();
    this.collisionEvents.length = 0;
    
    // Get all entities with colliders using query
    const colliderEntities = this.query.execute();
    
    // Broad phase: populate spatial grid
    this.broadPhase(colliderEntities);
    
    // Narrow phase: check actual collisions
    this.narrowPhase(colliderEntities);
    
    // Process collision events
    this.processCollisionEvents();
  }

  /**
   * Broad phase collision detection using spatial partitioning
   */
  private broadPhase(entities: any[]): void {
    for (const result of entities) {
      const entityId = result.entity;
      const transform = this.world.getComponent(entityId, Transform);
      const collider = this.world.getComponent(entityId, Collider);
      
      if (!transform || !collider || !collider.enabled) continue;
      
      const worldBounds = collider.getWorldBounds(transform);
      this.spatialGrid.add(entityId, worldBounds);
    }
  }

  /**
   * Narrow phase collision detection with exact collision testing
   */
  private narrowPhase(entities: any[]): void {
    for (const resultA of entities) {
      const entityAId = resultA.entity;
      const transformA = this.world.getComponent(entityAId, Transform);
      const colliderA = this.world.getComponent(entityAId, Collider);
      
      if (!transformA || !colliderA || !colliderA.enabled) continue;
      
      const boundsA = colliderA.getWorldBounds(transformA);
      const candidates = this.spatialGrid.query(boundsA);
      
      for (const entityBId of candidates) {
        if (entityBId === entityAId) continue;
        
        const transformB = this.world.getComponent(entityBId, Transform);
        const colliderB = this.world.getComponent(entityBId, Collider);
        
        if (!transformB || !colliderB || !colliderB.enabled) continue;
        
        // Check collision layers (using simple integer comparison for now)
        if (!colliderA.canCollideWith(colliderB.layer) || 
            !colliderB.canCollideWith(colliderA.layer)) continue;
        
        // Perform collision test
        const collision = this.testCollision(
          entityAId, colliderA, transformA,
          entityBId, colliderB, transformB
        );
        
        if (collision) {
          this.collisionEvents.push(collision);
        }
      }
    }
  }

  /**
   * Test collision between two entities
   */
  private testCollision(
    entityA: number, colliderA: Collider, transformA: Transform,
    entityB: number, colliderB: Collider, transformB: Transform
  ): CollisionEvent | null {
    const boundsA = colliderA.getWorldBounds(transformA);
    const boundsB = colliderB.getWorldBounds(transformB);
    
    // AABB collision test
    if (!this.aabbCollision(boundsA, boundsB)) {
      return null;
    }
    
    // Calculate collision details
    const centerA = new Vec2(
      boundsA.x + boundsA.width / 2,
      boundsA.y + boundsA.height / 2
    );
    const centerB = new Vec2(
      boundsB.x + boundsB.width / 2,
      boundsB.y + boundsB.height / 2
    );
    
    const delta = centerB.minus(centerA);
    const overlapX = (boundsA.width + boundsB.width) / 2 - Math.abs(delta.x);
    const overlapY = (boundsA.height + boundsB.height) / 2 - Math.abs(delta.y);
    
    let normal: Vec2;
    let penetration: number;
    
    if (overlapX < overlapY) {
      normal = new Vec2(delta.x > 0 ? 1 : -1, 0);
      penetration = overlapX;
    } else {
      normal = new Vec2(0, delta.y > 0 ? 1 : -1);
      penetration = overlapY;
    }
    
    const contactPoint = centerA.plus(delta.times(0.5));
    
    return {
      entityA,
      entityB,
      colliderA,
      colliderB,
      point: contactPoint,
      normal,
      penetration,
      timestamp: this.frameCount
    };
  }

  /**
   * AABB (Axis-Aligned Bounding Box) collision test
   */
  private aabbCollision(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Process collision events and trigger callbacks
   */
  private processCollisionEvents(): void {
    // Track collision enter/exit events
    const activeCollisions = new Map<number, Set<number>>();
    
    for (const event of this.collisionEvents) {
      const colliderA = event.colliderA;
      // const colliderB = event.colliderB; // Not used in this loop
      
      // Track active collisions for entity A
      if (!activeCollisions.has(event.entityA)) {
        activeCollisions.set(event.entityA, new Set());
      }
      activeCollisions.get(event.entityA)!.add(event.entityB);
      
      // Check for collision enter/stay
      if (!colliderA.currentCollisions.has(event.entityB)) {
        // Collision enter
        colliderA.currentCollisions.add(event.entityB);
        colliderA.onCollisionEnter?.(event);
      } else {
        // Collision stay
        colliderA.onCollisionStay?.(event);
      }
      
      // Handle collision response
      this.handleCollisionResponse(event);
    }
    
    // Check for collision exits
    const colliderEntities = this.query.execute();
    for (const result of colliderEntities) {
      const entityId = result.entity;
      const collider = this.world.getComponent(entityId, Collider);
      if (!collider) continue;
      
      const activeForEntity = activeCollisions.get(entityId) || new Set();
      
      for (const otherEntityId of collider.currentCollisions) {
        if (!activeForEntity.has(otherEntityId)) {
          // Collision exit
          const otherCollider = this.world.getComponent(otherEntityId, Collider);
          if (otherCollider) {
            const exitEvent: CollisionEvent = {
              entityA: entityId,
              entityB: otherEntityId,
              colliderA: collider,
              colliderB: otherCollider,
              point: new Vec2(0, 0),
              normal: new Vec2(0, 0),
              penetration: 0,
              timestamp: this.frameCount
            };
            collider.onCollisionExit?.(exitEvent);
          }
          collider.currentCollisions.delete(otherEntityId);
        }
      }
    }
  }

  /**
   * Handle collision response (blocking, triggers, etc.)
   * Updated to work with CoreComponents Collider
   */
  private handleCollisionResponse(event: CollisionEvent): void {
    const { entityA, entityB, colliderA, colliderB, normal, penetration } = event;
    
    // Skip if either is a trigger
    if (colliderA.isTrigger || colliderB.isTrigger) {
      return;
    }
    
    // Handle blocking collision for solid objects
    // Since CoreComponents Collider doesn't have response property, 
    // we assume non-triggers are blocking
    const transformA = this.world.getComponent(entityA, Transform);
    const transformB = this.world.getComponent(entityB, Transform);
    
    if (!transformA || !transformB) return;
    
    // Resolve collision by separating entities
    const separation = normal.times(penetration / 2);
    
    if (!colliderA.isStatic && !colliderB.isStatic) {
      // Both dynamic - split the separation
      transformA.position = transformA.position.minus(separation);
      transformB.position = transformB.position.plus(separation);
    } else if (!colliderA.isStatic) {
      // Only A is dynamic
      transformA.position = transformA.position.minus(normal.times(penetration));
    } else if (!colliderB.isStatic) {
      // Only B is dynamic
      transformB.position = transformB.position.plus(normal.times(penetration));
    }
  }

  /**
   * Check if a specific position would cause a collision
   */
  checkPositionCollision(
    entityId: number,
    position: Vec2,
    excludeLayers: number[] = []
  ): boolean {
    const collider = this.world.getComponent(entityId, Collider);
    if (!collider) return false;
    
    const testBounds = new Rect(
      position.x + collider.bounds.x,
      position.y + collider.bounds.y,
      collider.bounds.width,
      collider.bounds.height
    );
    
    const candidates = this.spatialGrid.query(testBounds);
    
    for (const candidateId of candidates) {
      if (candidateId === entityId) continue;
      
      const otherCollider = this.world.getComponent(candidateId, Collider);
      const otherTransform = this.world.getComponent(candidateId, Transform);
      
      if (!otherCollider || !otherTransform || !otherCollider.enabled) continue;
      if (excludeLayers.includes(otherCollider.layer)) continue;
      if (!collider.canCollideWith(otherCollider.layer)) continue;
      
      const otherBounds = otherCollider.getWorldBounds(otherTransform);
      
      if (this.aabbCollision(testBounds, otherBounds)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get all collisions for a specific entity
   */
  getCollisionsForEntity(entityId: number): CollisionEvent[] {
    return this.collisionEvents.filter(
      event => event.entityA === entityId || event.entityB === entityId
    );
  }

  /**
   * Create a collision layer mask from multiple layers
   */
  static createLayerMask(...layers: number[]): number {
    return CollisionLayers.createMask(...layers);
  }
}