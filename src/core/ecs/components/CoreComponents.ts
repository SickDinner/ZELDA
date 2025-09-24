import { Component, RegisterComponent } from '../Component.js';
import { Vec2 } from '../../math/Vec2.js';
import { Rect } from '../../math/Rect.js';
import { AnimationController } from '../../animation/AnimationController.js';
import { GridMovementController } from '../../movement/GridMovement.js';

// Position and transformation
@RegisterComponent('Transform')
export class Transform implements Component {
  readonly __componentType!: string;
  
  constructor(
    public position: Vec2 = new Vec2(0, 0),
    public rotation: number = 0,
    public scale: Vec2 = new Vec2(1, 1)
  ) {}
}

// Visual representation
@RegisterComponent('Sprite')
export class Sprite implements Component {
  readonly __componentType!: string;
  
  constructor(
    public textureId: string,
    public frame: Rect = new Rect(0, 0, 32, 32),
    public anchor: Vec2 = new Vec2(0.5, 0.5),
    public visible: boolean = true,
    public layer: number = 0,
    public flipX: boolean = false,
    public flipY: boolean = false,
    public tint: string = '#ffffff',
    public alpha: number = 1
  ) {}
}

// Physics collision
@RegisterComponent('Collider')
export class Collider implements Component {
  readonly __componentType!: string;
  
  // Collision tracking
  public currentCollisions: Set<number> = new Set();
  
  // Enhanced properties for the new collision system
  public enabled: boolean = true;
  public isStatic: boolean = false;
  
  // Collision callbacks (optional)
  public onCollisionEnter?: (event: any) => void;
  public onCollisionStay?: (event: any) => void;
  public onCollisionExit?: (event: any) => void;
  
  constructor(
    public bounds: Rect,
    public isTrigger: boolean = false,
    public layer: number = 0,
    public mask: number = 0xFFFFFFFF
  ) {}
  
  /**
   * Check if this collider can collide with the specified layer
   */
  canCollideWith(otherLayer: number): boolean {
    return (this.mask & otherLayer) !== 0;
  }
  
  /**
   * Get world bounds for this collider given entity transform
   */
  getWorldBounds(transform: Transform): Rect {
    return new Rect(
      transform.position.x + this.bounds.x,
      transform.position.y + this.bounds.y,
      this.bounds.width,
      this.bounds.height
    );
  }
  
  /**
   * Set collision callbacks
   */
  setCallbacks(
    onEnter?: (event: any) => void,
    onStay?: (event: any) => void,
    onExit?: (event: any) => void
  ): void {
    this.onCollisionEnter = onEnter;
    this.onCollisionStay = onStay;
    this.onCollisionExit = onExit;
  }
}

// Kinematic movement
@RegisterComponent('RigidBody')
export class RigidBody implements Component {
  readonly __componentType!: string;
  
  constructor(
    public velocity: Vec2 = new Vec2(0, 0),
    public maxSpeed: number = 100,
    public friction: number = 0.9,
    public isKinematic: boolean = true
  ) {}
}

// AI/Player control
@RegisterComponent('Brain')
export class Brain implements Component {
  readonly __componentType!: string;
  
  constructor(
    public type: 'player' | 'ai' | 'scripted' = 'ai',
    public aiState: string = 'idle',
    public target?: number,
    public parameters: Record<string, any> = {}
  ) {}
}

// RPG stats
@RegisterComponent('Stats')
export class Stats implements Component {
  readonly __componentType!: string;
  
  // Base stats
  public hp: number = 100;
  public maxHp: number = 100;
  public mp: number = 50;
  public maxMp: number = 50;
  public str: number = 10;
  public dex: number = 10;
  public int: number = 10;
  public vit: number = 10;
  public spd: number = 10;
  public luck: number = 10;
  
  // Computed stats (calculated from base + equipment + buffs)
  public physAtk: number = 0;
  public physDef: number = 0;
  public magAtk: number = 0;
  public magDef: number = 0;
  public move: number = 3;
  public range: number = 1;
  public crit: number = 5;
  
  constructor(baseStats?: Partial<Stats>) {
    if (baseStats) {
      Object.assign(this, baseStats);
    }
    this.computeStats();
  }
  
  public computeStats(): void {
    this.physAtk = Math.floor(this.str * 1.2 + this.dex * 0.3);
    this.physDef = Math.floor(this.vit * 1.1 + this.str * 0.2);
    this.magAtk = Math.floor(this.int * 1.3 + this.luck * 0.2);
    this.magDef = Math.floor(this.int * 0.8 + this.vit * 0.4);
  }
}

// Item storage
@RegisterComponent('Inventory')
export class Inventory implements Component {
  readonly __componentType!: string;
  
  constructor(
    public items: Array<{ id: string; quantity: number }> = [],
    public maxSlots: number = 20
  ) {}
  
  public addItem(itemId: string, quantity: number = 1): boolean {
    const existing = this.items.find(item => item.id === itemId);
    if (existing) {
      existing.quantity += quantity;
      return true;
    }
    
    if (this.items.length >= this.maxSlots) {
      return false;
    }
    
    this.items.push({ id: itemId, quantity });
    return true;
  }
  
  public removeItem(itemId: string, quantity: number = 1): boolean {
    const existing = this.items.find(item => item.id === itemId);
    if (!existing || existing.quantity < quantity) {
      return false;
    }
    
    existing.quantity -= quantity;
    if (existing.quantity <= 0) {
      const index = this.items.indexOf(existing);
      this.items.splice(index, 1);
    }
    
    return true;
  }
}

// Team/enemy affiliation
@RegisterComponent('Faction')
export class Faction implements Component {
  readonly __componentType!: string;
  
  constructor(
    public team: 'player' | 'enemy' | 'neutral' = 'neutral',
    public hostileTo: string[] = []
  ) {}
}

// Interactive objects
@RegisterComponent('Interactable')
export class Interactable implements Component {
  readonly __componentType!: string;
  
  constructor(
    public type: 'talk' | 'inspect' | 'pickup' | 'door' | 'chest' | 'switch' = 'talk',
    public text?: string,
    public scriptId?: string,
    public parameters: Record<string, any> = {},
    public used: boolean = false
  ) {}
}

// Animation state (legacy - kept for compatibility)
@RegisterComponent('AnimationState')
export class AnimationState implements Component {
  readonly __componentType!: string;
  
  constructor(
    public currentAnim: string = 'idle',
    public frame: number = 0,
    public time: number = 0,
    public speed: number = 1,
    public loop: boolean = true,
    public playing: boolean = true
  ) {}
}

// Advanced animation controller component
@RegisterComponent('Animator')
export class Animator implements Component {
  readonly __componentType!: string;
  public controller: AnimationController;
  
  constructor() {
    this.controller = new AnimationController();
  }
}

// Grid-based movement component
@RegisterComponent('GridMovement')
export class GridMovement implements Component {
  readonly __componentType!: string;
  public controller: GridMovementController;
  
  constructor(
    gridPosition: { x: number; y: number } = { x: 0, y: 0 },
    settings: any = {}
  ) {
    this.controller = new GridMovementController(gridPosition, settings);
  }
}

// Input handling for player-controlled entities
@RegisterComponent('PlayerInput')
export class PlayerInput implements Component {
  readonly __componentType!: string;
  
  constructor(
    public enabled: boolean = true,
    public inputBuffer: string[] = [], // Store recent inputs for combos
    public lastInput: string = '',
    public inputCooldown: number = 0
  ) {}
}

// Dialogue component for NPCs and interactive objects
@RegisterComponent('DialogueComponent')
export class DialogueComponent implements Component {
  readonly __componentType!: string;
  
  constructor(
    public dialogueTreeId: string,
    public triggerDistance: number = 32, // Distance at which dialogue can be triggered
    public autoTrigger: boolean = false, // Automatically start dialogue on collision
    public requiresInteraction: boolean = true, // Requires player to press a key
    public interactionKey: string = 'KeyE',
    public canRepeat: boolean = true, // Can dialogue be repeated
    public hasBeenTriggered: boolean = false,
    public isActive: boolean = false // Currently in dialogue
  ) {}
  
  /**
   * Check if dialogue can be triggered
   */
  canTrigger(): boolean {
    if (!this.canRepeat && this.hasBeenTriggered) return false;
    return !this.isActive;
  }
  
  /**
   * Mark dialogue as triggered
   */
  trigger(): void {
    this.hasBeenTriggered = true;
    this.isActive = true;
  }
  
  /**
   * End dialogue
   */
  endDialogue(): void {
    this.isActive = false;
  }
}
