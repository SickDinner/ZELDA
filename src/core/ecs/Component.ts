export interface Component {
  readonly __componentType: string;
}

export type ComponentType<T extends Component> = new (...args: any[]) => T;

export abstract class ComponentRegistry {
  private static typeMap = new Map<string, ComponentType<any>>();
  private static nameMap = new Map<ComponentType<any>, string>();

  public static register<T extends Component>(
    name: string, 
    componentClass: ComponentType<T>
  ): void {
    this.typeMap.set(name, componentClass);
    this.nameMap.set(componentClass, name);
    
    // Add the component type identifier to the prototype
    if (!componentClass.prototype.__componentType) {
      Object.defineProperty(componentClass.prototype, '__componentType', {
        value: name,
        writable: false,
        enumerable: false
      });
    }
  }

  public static getType<T extends Component>(name: string): ComponentType<T> | undefined {
    return this.typeMap.get(name);
  }

  public static getName<T extends Component>(componentClass: ComponentType<T>): string | undefined {
    return this.nameMap.get(componentClass);
  }

  public static getTypeName<T extends Component>(component: T): string {
    return component.__componentType;
  }
}

// Helper decorator for automatic registration
export function RegisterComponent(name: string) {
  return function<T extends ComponentType<any>>(target: T): T {
    ComponentRegistry.register(name, target);
    return target;
  };
}