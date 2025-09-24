import { EntityId } from './Entity.js';
import { Component, ComponentType } from './Component.js';
import { World } from './World.js';

export abstract class System {
  public readonly name: string;
  public enabled: boolean = true;
  protected world!: World;

  constructor(name: string) {
    this.name = name;
  }

  public setWorld(world: World): void {
    this.world = world;
  }

  public abstract update(dt: number): void;

  // Optional lifecycle methods
  public initialize?(): void;
  public cleanup?(): void;
}

export interface QueryResult {
  entity: EntityId;
  components: Component[];
}

export class Query {
  private componentTypes: ComponentType<any>[] = [];
  private excludeTypes: ComponentType<any>[] = [];
  private world: World;
  private cached: QueryResult[] = [];
  private dirty: boolean = true;

  constructor(world: World) {
    this.world = world;
  }

  public with<T extends Component>(componentType: ComponentType<T>): this {
    this.componentTypes.push(componentType);
    this.dirty = true;
    return this;
  }

  public without<T extends Component>(componentType: ComponentType<T>): this {
    this.excludeTypes.push(componentType);
    this.dirty = true;
    return this;
  }

  public execute(): QueryResult[] {
    if (!this.dirty) {
      return this.cached;
    }

    this.cached = [];
    
    for (const entityId of this.world.getAllEntities()) {
      const components: Component[] = [];
      let hasAll = true;
      let hasExcluded = false;

      // Check required components
      for (const type of this.componentTypes) {
        const component = this.world.getComponent(entityId, type);
        if (!component) {
          hasAll = false;
          break;
        }
        components.push(component);
      }

      // Check excluded components
      if (hasAll) {
        for (const type of this.excludeTypes) {
          if (this.world.hasComponent(entityId, type)) {
            hasExcluded = true;
            break;
          }
        }
      }

      if (hasAll && !hasExcluded) {
        this.cached.push({ entity: entityId, components });
      }
    }

    this.dirty = false;
    return this.cached;
  }

  public invalidate(): void {
    this.dirty = true;
  }

  public forEach(callback: (entity: EntityId, ...components: Component[]) => void): void {
    const results = this.execute();
    for (const result of results) {
      callback(result.entity, ...result.components);
    }
  }
}