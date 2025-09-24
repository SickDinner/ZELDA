export type EntityId = number;

export class Entity {
  public readonly id: EntityId;
  private static nextId: EntityId = 1;

  constructor() {
    this.id = Entity.nextId++;
  }

  public static reset(): void {
    Entity.nextId = 1;
  }

  public toString(): string {
    return `Entity(${this.id})`;
  }
}