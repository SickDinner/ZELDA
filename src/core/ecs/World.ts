import { Entity, EntityId } from './Entity.js';
import { Component, ComponentType, ComponentRegistry } from './Component.js';
import { System, Query } from './System.js';

export type Plugin = (world: World) => void;

export class World {
  private entities = new Map<EntityId, Entity>();
  private components = new Map<string, Map<EntityId, Component>>();
  private systems: System[] = [];
  private queries: Query[] = [];
  
  // Component change tracking for query invalidation
  private componentChangeListeners = new Set<() => void>();

  public createEntity(): Entity {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    return entity;
  }

  public removeEntity(entityId: EntityId): void {
    if (!this.entities.has(entityId)) return;

    // Remove all components for this entity
    for (const componentMap of this.components.values()) {
      componentMap.delete(entityId);
    }

    this.entities.delete(entityId);
    this.invalidateQueries();
  }

  public addComponent<T extends Component>(
    entityId: EntityId, 
    component: T
  ): void {
    const typeName = ComponentRegistry.getTypeName(component);
    
    if (!this.components.has(typeName)) {
      this.components.set(typeName, new Map());
    }

    this.components.get(typeName)!.set(entityId, component);
    this.invalidateQueries();
  }

  public removeComponent<T extends Component>(
    entityId: EntityId, 
    componentType: ComponentType<T>
  ): void {
    const typeName = ComponentRegistry.getName(componentType);
    if (!typeName) return;

    const componentMap = this.components.get(typeName);
    if (componentMap) {
      componentMap.delete(entityId);
      this.invalidateQueries();
    }
  }

  public getComponent<T extends Component>(
    entityId: EntityId, 
    componentType: ComponentType<T>
  ): T | undefined {
    const typeName = ComponentRegistry.getName(componentType);
    if (!typeName) return undefined;

    const componentMap = this.components.get(typeName);
    return componentMap?.get(entityId) as T | undefined;
  }

  public hasComponent<T extends Component>(
    entityId: EntityId, 
    componentType: ComponentType<T>
  ): boolean {
    const typeName = ComponentRegistry.getName(componentType);
    if (!typeName) return false;

    const componentMap = this.components.get(typeName);
    return componentMap?.has(entityId) ?? false;
  }

  public getAllEntities(): EntityId[] {
    return Array.from(this.entities.keys());
  }

  public getEntity(entityId: EntityId): Entity | undefined {
    return this.entities.get(entityId);
  }

  public addSystem(system: System): void {
    system.setWorld(this);
    this.systems.push(system);
    
    if (system.initialize) {
      system.initialize();
    }
  }

  public removeSystem(systemName: string): void {
    const index = this.systems.findIndex(s => s.name === systemName);
    if (index !== -1) {
      const system = this.systems[index];
      if (system.cleanup) {
        system.cleanup();
      }
      this.systems.splice(index, 1);
    }
  }

  public getSystem<T extends System>(systemName: string): T | undefined {
    return this.systems.find(s => s.name === systemName) as T | undefined;
  }

  public update(dt: number): void {
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(dt);
      }
    }
  }

  public createQuery(): Query {
    const query = new Query(this);
    this.queries.push(query);
    return query;
  }

  private invalidateQueries(): void {
    for (const query of this.queries) {
      query.invalidate();
    }
    
    for (const listener of this.componentChangeListeners) {
      listener();
    }
  }

  public onComponentChange(callback: () => void): void {
    this.componentChangeListeners.add(callback);
  }

  public offComponentChange(callback: () => void): void {
    this.componentChangeListeners.delete(callback);
  }

  // Plugin system
  public use(plugin: Plugin): void {
    plugin(this);
  }

  // Debug and utility methods
  public getEntityCount(): number {
    return this.entities.size;
  }

  public getComponentCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [typeName, componentMap] of this.components) {
      counts[typeName] = componentMap.size;
    }
    return counts;
  }

  public clear(): void {
    // Cleanup all systems
    for (const system of this.systems) {
      if (system.cleanup) {
        system.cleanup();
      }
    }

    this.entities.clear();
    this.components.clear();
    this.systems.length = 0;
    this.queries.length = 0;
    this.componentChangeListeners.clear();
  }
}