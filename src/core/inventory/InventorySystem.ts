import { Vec2 } from '../math/Vec2';

/**
 * Item types for different categories of inventory items
 */
export enum ItemType {
  CONSUMABLE = 'consumable',
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  KEY_ITEM = 'key_item',
  MATERIAL = 'material',
  TREASURE = 'treasure'
}

/**
 * Item rarity levels
 */
export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

/**
 * Equipment slots
 */
export enum EquipmentSlot {
  WEAPON = 'weapon',
  SHIELD = 'shield',
  HELMET = 'helmet',
  ARMOR = 'armor',
  BOOTS = 'boots',
  ACCESSORY_1 = 'accessory_1',
  ACCESSORY_2 = 'accessory_2'
}

/**
 * Item effect types
 */
export enum ItemEffectType {
  HEAL_HP = 'heal_hp',
  HEAL_MP = 'heal_mp',
  BUFF_ATTACK = 'buff_attack',
  BUFF_DEFENSE = 'buff_defense',
  BUFF_SPEED = 'buff_speed',
  CURE_STATUS = 'cure_status',
  TELEPORT = 'teleport',
  CUSTOM = 'custom'
}

/**
 * Item effect definition
 */
export interface ItemEffect {
  type: ItemEffectType;
  value: number;
  duration?: number; // For temporary effects
  target?: 'self' | 'party' | 'enemy';
  description: string;
}

/**
 * Base item definition
 */
export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string; // Icon identifier or Kenney sprite ID
  value: number; // Base value/price
  maxStack: number;
  isConsumable: boolean;
  isEquippable: boolean;
  equipmentSlot?: EquipmentSlot;
  effects?: ItemEffect[];
  requirements?: {
    level?: number;
    stats?: Record<string, number>;
  };
  tags?: string[];
}

/**
 * Item instance in inventory
 */
export interface InventoryItem {
  definition: ItemDefinition;
  quantity: number;
  durability?: number; // For equipment
  enchantments?: string[]; // Special properties
  isEquipped?: boolean;
}

/**
 * Inventory slot representation
 */
export interface InventorySlot {
  index: number;
  item: InventoryItem | null;
  locked: boolean;
}

/**
 * Equipment loadout
 */
export interface Equipment {
  [EquipmentSlot.WEAPON]?: InventoryItem;
  [EquipmentSlot.SHIELD]?: InventoryItem;
  [EquipmentSlot.HELMET]?: InventoryItem;
  [EquipmentSlot.ARMOR]?: InventoryItem;
  [EquipmentSlot.BOOTS]?: InventoryItem;
  [EquipmentSlot.ACCESSORY_1]?: InventoryItem;
  [EquipmentSlot.ACCESSORY_2]?: InventoryItem;
}

/**
 * Inventory filtering and sorting options
 */
export interface InventoryFilter {
  type?: ItemType;
  rarity?: ItemRarity;
  searchText?: string;
  sortBy?: 'name' | 'type' | 'rarity' | 'value' | 'quantity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Inventory UI configuration
 */
export interface InventoryConfig {
  slotsPerRow: number;
  slotSize: Vec2;
  slotPadding: number;
  position: Vec2;
  backgroundColor: string;
  borderColor: string;
  selectedColor: string;
  fontSize: number;
  showTooltips: boolean;
  showItemNames: boolean;
  showQuantities: boolean;
}

/**
 * Inventory event callbacks
 */
export interface InventoryCallbacks {
  onItemAdded?: (item: InventoryItem, quantity: number) => void;
  onItemRemoved?: (item: InventoryItem, quantity: number) => void;
  onItemUsed?: (item: InventoryItem) => void;
  onItemEquipped?: (item: InventoryItem, slot: EquipmentSlot) => void;
  onItemUnequipped?: (item: InventoryItem, slot: EquipmentSlot) => void;
  onInventoryFull?: () => void;
}

/**
 * Item database for managing item definitions
 */
export class ItemDatabase {
  private static items: Map<string, ItemDefinition> = new Map();
  
  /**
   * Register an item definition
   */
  static register(itemDef: Omit<ItemDefinition, 'icon' | 'maxStack' | 'isConsumable' | 'isEquippable'> & {
    stackSize?: number;
    consumable?: { effect: string; power: number; duration: number };
    equipment?: { slot: string; stats: Record<string, number> };
  }): void {
    const definition: ItemDefinition = {
      ...itemDef,
      icon: itemDef.id, // Use ID as icon by default
      maxStack: itemDef.stackSize || 1,
      isConsumable: !!itemDef.consumable,
      isEquippable: !!itemDef.equipment,
      equipmentSlot: itemDef.equipment?.slot as EquipmentSlot,
      effects: []
    };
    
    this.items.set(itemDef.id, definition);
  }
  
  /**
   * Get an item definition by ID
   */
  static get(id: string): ItemDefinition | undefined {
    return this.items.get(id);
  }
  
  /**
   * Get all registered items
   */
  static getAll(): ItemDefinition[] {
    return Array.from(this.items.values());
  }
  
  /**
   * Check if an item exists
   */
  static exists(id: string): boolean {
    return this.items.has(id);
  }
}

/**
 * Main inventory system class
 */
export class InventorySystem {
  private slots: InventorySlot[];
  private equipment: Equipment = {};
  private capacity: number;
  private config: InventoryConfig;
  private callbacks: InventoryCallbacks;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // UI state
  private isOpen: boolean = false;
  private selectedSlot: number = 0;
  private currentFilter: InventoryFilter = {};
  private filteredSlots: InventorySlot[] = [];
  
  // Input handling
  private keysPressed: Set<string> = new Set();
  
  constructor(
    canvas: HTMLCanvasElement,
    capacity: number = 40,
    config?: Partial<InventoryConfig>,
    callbacks?: InventoryCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.capacity = capacity;
    this.callbacks = callbacks || {};
    
    // Default configuration
    this.config = {
      slotsPerRow: 8,
      slotSize: new Vec2(50, 50),
      slotPadding: 5,
      position: new Vec2(50, 50),
      backgroundColor: 'rgba(0, 0, 30, 0.95)',
      borderColor: '#ffffff',
      selectedColor: '#ffff00',
      fontSize: 12,
      showTooltips: true,
      showItemNames: true,
      showQuantities: true,
      ...config
    };
    
    // Initialize inventory slots
    this.slots = [];
    for (let i = 0; i < this.capacity; i++) {
      this.slots.push({
        index: i,
        item: null,
        locked: false
      });
    }
    
    this.filteredSlots = [...this.slots];
    this.setupInputHandling();
  }

  /**
   * Add an item to the inventory
   */
  addItem(itemIdOrDefinition: string | ItemDefinition, quantity: number = 1): boolean {
    const itemDefinition = typeof itemIdOrDefinition === 'string' 
      ? ItemDatabase.get(itemIdOrDefinition)
      : itemIdOrDefinition;
      
    if (!itemDefinition) {
      console.warn('Item not found:', itemIdOrDefinition);
      return false;
    }
    // Try to stack with existing items first
    if (itemDefinition.maxStack > 1) {
      for (const slot of this.slots) {
        if (slot.item && 
            slot.item.definition.id === itemDefinition.id && 
            slot.item.quantity < itemDefinition.maxStack) {
          
          const spaceAvailable = itemDefinition.maxStack - slot.item.quantity;
          const amountToAdd = Math.min(quantity, spaceAvailable);
          
          slot.item.quantity += amountToAdd;
          quantity -= amountToAdd;
          
          this.callbacks.onItemAdded?.(slot.item, amountToAdd);
          
          if (quantity <= 0) {
            this.updateFilter();
            return true;
          }
        }
      }
    }
    
    // Add to empty slots
    while (quantity > 0) {
      const emptySlot = this.slots.find(slot => !slot.item && !slot.locked);
      if (!emptySlot) {
        this.callbacks.onInventoryFull?.();
        return false;
      }
      
      const amountToAdd = Math.min(quantity, itemDefinition.maxStack);
      const newItem: InventoryItem = {
        definition: itemDefinition,
        quantity: amountToAdd,
        durability: itemDefinition.isEquippable ? 100 : undefined
      };
      
      emptySlot.item = newItem;
      quantity -= amountToAdd;
      
      this.callbacks.onItemAdded?.(newItem, amountToAdd);
    }
    
    this.updateFilter();
    return true;
  }

  /**
   * Remove an item from the inventory
   */
  removeItem(itemId: string, quantity: number = 1): boolean {
    let remainingToRemove = quantity;
    
    for (const slot of this.slots) {
      if (slot.item && slot.item.definition.id === itemId && remainingToRemove > 0) {
        const amountToRemove = Math.min(remainingToRemove, slot.item.quantity);
        
        this.callbacks.onItemRemoved?.(slot.item, amountToRemove);
        
        slot.item.quantity -= amountToRemove;
        remainingToRemove -= amountToRemove;
        
        if (slot.item.quantity <= 0) {
          slot.item = null;
        }
      }
    }
    
    this.updateFilter();
    return remainingToRemove === 0;
  }

  /**
   * Use/consume an item
   */
  useItem(slotIndex: number): boolean {
    const slot = this.slots[slotIndex];
    if (!slot?.item) return false;
    
    const item = slot.item;
    
    // Execute item effects
    if (item.definition.effects) {
      for (const effect of item.definition.effects) {
        this.executeItemEffect(effect, item);
      }
    }
    
    this.callbacks.onItemUsed?.(item);
    
    // Consume the item if it's consumable
    if (item.definition.isConsumable) {
      this.removeItem(item.definition.id, 1);
    }
    
    return true;
  }

  /**
   * Equip an item
   */
  equipItem(slotIndex: number): boolean {
    const slot = this.slots[slotIndex];
    if (!slot?.item || !slot.item.definition.isEquippable) {
      return false;
    }
    
    const item = slot.item;
    const equipmentSlot = item.definition.equipmentSlot;
    
    if (!equipmentSlot) {
      console.warn('Item has no equipment slot defined:', item.definition.name);
      return false;
    }
    
    // Unequip current item in that slot
    if (this.equipment[equipmentSlot]) {
      this.unequipItem(equipmentSlot);
    }
    
    // Equip the new item
    this.equipment[equipmentSlot] = item;
    item.isEquipped = true;
    
    this.callbacks.onItemEquipped?.(item, equipmentSlot);
    return true;
  }

  /**
   * Unequip an item
   */
  unequipItem(equipmentSlot: EquipmentSlot): boolean {
    const item = this.equipment[equipmentSlot];
    if (!item) return false;
    
    delete this.equipment[equipmentSlot];
    item.isEquipped = false;
    
    this.callbacks.onItemUnequipped?.(item, equipmentSlot);
    return true;
  }

  /**
   * Get item count by ID
   */
  getItemCount(itemId: string): number {
    return this.slots
      .filter(slot => slot.item?.definition.id === itemId)
      .reduce((total, slot) => total + (slot.item?.quantity || 0), 0);
  }

  /**
   * Check if inventory has item
   */
  hasItem(itemId: string, quantity: number = 1): boolean {
    return this.getItemCount(itemId) >= quantity;
  }

  /**
   * Get all items of a specific type
   */
  getItemsByType(type: ItemType): InventoryItem[] {
    return this.slots
      .filter(slot => slot.item && slot.item.definition.type === type)
      .map(slot => slot.item!);
  }

  /**
   * Apply inventory filter
   */
  applyFilter(filter: InventoryFilter): void {
    this.currentFilter = filter;
    this.updateFilter();
  }

  /**
   * Toggle inventory UI
   */
  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.selectedSlot = 0;
      this.updateFilter();
    }
  }

  /**
   * Open inventory UI
   */
  open(): void {
    this.isOpen = true;
    this.selectedSlot = 0;
    this.updateFilter();
  }

  /**
   * Close inventory UI
   */
  close(): void {
    this.isOpen = false;
  }

  /**
   * Check if inventory is open
   */
  isInventoryOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Update the inventory system
   */
  update(_deltaTime: number): void {
    if (!this.isOpen) return;
    
    this.handleInput();
  }

  /**
   * Render the inventory UI
   */
  render(): void {
    if (!this.isOpen) return;
    
    this.renderBackground();
    this.renderSlots();
    this.renderEquipment();
    this.renderTooltip();
  }

  /**
   * Get inventory statistics
   */
  getStats(): {
    usedSlots: number;
    totalSlots: number;
    totalValue: number;
    itemsByType: Record<ItemType, number>;
  } {
    const usedSlots = this.slots.filter(slot => slot.item).length;
    const totalValue = this.slots.reduce((total, slot) => {
      return total + (slot.item ? slot.item.definition.value * slot.item.quantity : 0);
    }, 0);
    
    const itemsByType: Record<ItemType, number> = Object.values(ItemType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<ItemType, number>);
    
    this.slots.forEach(slot => {
      if (slot.item) {
        itemsByType[slot.item.definition.type] += slot.item.quantity;
      }
    });
    
    return {
      usedSlots,
      totalSlots: this.capacity,
      totalValue,
      itemsByType
    };
  }

  /**
   * Execute item effect
   */
  private executeItemEffect(effect: ItemEffect, item: InventoryItem): void {
    console.log(`Executing ${effect.type} effect from ${item.definition.name}: ${effect.description}`);
    
    // This is where you'd integrate with your game's stats/combat system
    // For now, just log the effect
    switch (effect.type) {
      case ItemEffectType.HEAL_HP:
        console.log(`Healing ${effect.value} HP`);
        break;
      case ItemEffectType.HEAL_MP:
        console.log(`Healing ${effect.value} MP`);
        break;
      case ItemEffectType.BUFF_ATTACK:
        console.log(`Boosting attack by ${effect.value} for ${effect.duration || 0}s`);
        break;
      // Add more effect types as needed
    }
  }

  /**
   * Update filtered slots based on current filter
   */
  private updateFilter(): void {
    this.filteredSlots = this.slots.filter(slot => {
      if (!slot.item) return true; // Show empty slots
      
      const item = slot.item.definition;
      
      // Type filter
      if (this.currentFilter.type && item.type !== this.currentFilter.type) {
        return false;
      }
      
      // Rarity filter
      if (this.currentFilter.rarity && item.rarity !== this.currentFilter.rarity) {
        return false;
      }
      
      // Text search
      if (this.currentFilter.searchText) {
        const searchLower = this.currentFilter.searchText.toLowerCase();
        if (!item.name.toLowerCase().includes(searchLower) && 
            !item.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort filtered results
    if (this.currentFilter.sortBy) {
      this.filteredSlots.sort((a, b) => {
        if (!a.item && !b.item) return 0;
        if (!a.item) return 1;
        if (!b.item) return -1;
        
        let valueA: any;
        let valueB: any;
        
        switch (this.currentFilter.sortBy) {
          case 'name':
            valueA = a.item.definition.name;
            valueB = b.item.definition.name;
            break;
          case 'type':
            valueA = a.item.definition.type;
            valueB = b.item.definition.type;
            break;
          case 'rarity':
            valueA = Object.values(ItemRarity).indexOf(a.item.definition.rarity);
            valueB = Object.values(ItemRarity).indexOf(b.item.definition.rarity);
            break;
          case 'value':
            valueA = a.item.definition.value;
            valueB = b.item.definition.value;
            break;
          case 'quantity':
            valueA = a.item.quantity;
            valueB = b.item.quantity;
            break;
          default:
            return 0;
        }
        
        if (valueA < valueB) return this.currentFilter.sortOrder === 'desc' ? 1 : -1;
        if (valueA > valueB) return this.currentFilter.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }
  }

  /**
   * Handle input for inventory navigation
   */
  private handleInput(): void {
    const slotsPerRow = this.config.slotsPerRow;
    const totalSlots = this.filteredSlots.length;
    
    if (this.keysPressed.has('ArrowUp')) {
      this.selectedSlot = Math.max(0, this.selectedSlot - slotsPerRow);
      this.keysPressed.delete('ArrowUp');
    } else if (this.keysPressed.has('ArrowDown')) {
      this.selectedSlot = Math.min(totalSlots - 1, this.selectedSlot + slotsPerRow);
      this.keysPressed.delete('ArrowDown');
    } else if (this.keysPressed.has('ArrowLeft')) {
      if (this.selectedSlot % slotsPerRow > 0) {
        this.selectedSlot--;
      }
      this.keysPressed.delete('ArrowLeft');
    } else if (this.keysPressed.has('ArrowRight')) {
      if (this.selectedSlot % slotsPerRow < slotsPerRow - 1 && this.selectedSlot < totalSlots - 1) {
        this.selectedSlot++;
      }
      this.keysPressed.delete('ArrowRight');
    } else if (this.keysPressed.has('Enter') || this.keysPressed.has('Space')) {
      this.useItem(this.filteredSlots[this.selectedSlot].index);
      this.keysPressed.delete('Enter');
      this.keysPressed.delete('Space');
    } else if (this.keysPressed.has('KeyE')) {
      this.equipItem(this.filteredSlots[this.selectedSlot].index);
      this.keysPressed.delete('KeyE');
    } else if (this.keysPressed.has('Escape') || this.keysPressed.has('KeyI')) {
      this.close();
      this.keysPressed.delete('Escape');
      this.keysPressed.delete('KeyI');
    }
  }

  /**
   * Render inventory background
   */
  private renderBackground(): void {
    const padding = 20;
    const width = this.canvas.width - padding * 2;
    const height = this.canvas.height - padding * 2;
    
    // Background
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(padding, padding, width, height);
    
    // Border
    this.ctx.strokeStyle = this.config.borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(padding, padding, width, height);
    
    // Title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px monospace';
    this.ctx.fillText('Inventory', padding + 20, padding + 30);
    
    // Stats
    const stats = this.getStats();
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`${stats.usedSlots}/${stats.totalSlots} slots used`, padding + 20, padding + 50);
    this.ctx.fillText(`Total value: ${stats.totalValue} gold`, padding + 200, padding + 50);
  }

  /**
   * Render inventory slots
   */
  private renderSlots(): void {
    const startX = this.config.position.x;
    const startY = this.config.position.y + 50;
    const slotSize = this.config.slotSize;
    const padding = this.config.slotPadding;
    
    this.filteredSlots.forEach((slot, index) => {
      const row = Math.floor(index / this.config.slotsPerRow);
      const col = index % this.config.slotsPerRow;
      
      const x = startX + col * (slotSize.x + padding);
      const y = startY + row * (slotSize.y + padding);
      
      // Slot background
      this.ctx.fillStyle = slot.item ? this.getRarityColor(slot.item.definition.rarity) : 'rgba(50, 50, 50, 0.5)';
      this.ctx.fillRect(x, y, slotSize.x, slotSize.y);
      
      // Slot border
      const isSelected = index === this.selectedSlot;
      this.ctx.strokeStyle = isSelected ? this.config.selectedColor : this.config.borderColor;
      this.ctx.lineWidth = isSelected ? 3 : 1;
      this.ctx.strokeRect(x, y, slotSize.x, slotSize.y);
      
      // Item icon (placeholder)
      if (slot.item) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '8px monospace';
        this.ctx.fillText(slot.item.definition.name.substring(0, 6), x + 2, y + 12);
        
        // Quantity
        if (slot.item.quantity > 1 && this.config.showQuantities) {
          this.ctx.fillStyle = '#ffff00';
          this.ctx.font = '10px monospace';
          this.ctx.fillText(slot.item.quantity.toString(), x + slotSize.x - 15, y + slotSize.y - 5);
        }
        
        // Equipped indicator
        if (slot.item.isEquipped) {
          this.ctx.fillStyle = '#00ff00';
          this.ctx.fillText('E', x + 2, y + slotSize.y - 5);
        }
      }
    });
  }

  /**
   * Render equipment slots
   */
  private renderEquipment(): void {
    const startX = this.canvas.width - 200;
    const startY = 100;
    const slotSize = 40;
    const slots = Object.values(EquipmentSlot);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('Equipment', startX, startY - 10);
    
    slots.forEach((slot, index) => {
      const x = startX;
      const y = startY + index * (slotSize + 10);
      
      // Slot background
      const item = this.equipment[slot];
      this.ctx.fillStyle = item ? this.getRarityColor(item.definition.rarity) : 'rgba(30, 30, 30, 0.7)';
      this.ctx.fillRect(x, y, slotSize, slotSize);
      
      // Slot border
      this.ctx.strokeStyle = '#888888';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, slotSize, slotSize);
      
      // Slot label
      this.ctx.fillStyle = '#cccccc';
      this.ctx.font = '10px monospace';
      this.ctx.fillText(slot, x + slotSize + 10, y + 12);
      
      // Item name
      if (item) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(item.definition.name, x + slotSize + 10, y + 25);
      }
    });
  }

  /**
   * Render tooltip for selected item
   */
  private renderTooltip(): void {
    if (!this.config.showTooltips) return;
    
    const selectedSlot = this.filteredSlots[this.selectedSlot];
    if (!selectedSlot?.item) return;
    
    const item = selectedSlot.item;
    const def = item.definition;
    
    const tooltipX = this.canvas.width - 300;
    const tooltipY = 350;
    const tooltipWidth = 280;
    const tooltipHeight = 200;
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    
    // Border
    this.ctx.strokeStyle = this.getRarityColor(def.rarity);
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    
    // Content
    let yOffset = tooltipY + 20;
    
    // Name
    this.ctx.fillStyle = this.getRarityColor(def.rarity);
    this.ctx.font = '14px monospace';
    this.ctx.fillText(def.name, tooltipX + 10, yOffset);
    yOffset += 20;
    
    // Type and rarity
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '10px monospace';
    this.ctx.fillText(`${def.type} - ${def.rarity}`, tooltipX + 10, yOffset);
    yOffset += 15;
    
    // Description
    this.ctx.fillStyle = '#ffffff';
    const words = def.description.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line + word + ' ';
      if (this.ctx.measureText(testLine).width > tooltipWidth - 20) {
        this.ctx.fillText(line, tooltipX + 10, yOffset);
        line = word + ' ';
        yOffset += 12;
      } else {
        line = testLine;
      }
    }
    if (line) {
      this.ctx.fillText(line, tooltipX + 10, yOffset);
      yOffset += 15;
    }
    
    // Effects
    if (def.effects && def.effects.length > 0) {
      this.ctx.fillStyle = '#88ff88';
      this.ctx.fillText('Effects:', tooltipX + 10, yOffset);
      yOffset += 12;
      
      def.effects.forEach(effect => {
        this.ctx.fillStyle = '#aaffaa';
        this.ctx.fillText(`• ${effect.description}`, tooltipX + 15, yOffset);
        yOffset += 12;
      });
    }
    
    // Value
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fillText(`Value: ${def.value} gold`, tooltipX + 10, yOffset + 10);
    
    // Quantity
    if (item.quantity > 1) {
      this.ctx.fillText(`Quantity: ${item.quantity}`, tooltipX + 150, yOffset + 10);
    }
  }

  /**
   * Get color for item rarity
   */
  private getRarityColor(rarity: ItemRarity): string {
    switch (rarity) {
      case ItemRarity.COMMON: return '#cccccc';
      case ItemRarity.UNCOMMON: return '#00ff00';
      case ItemRarity.RARE: return '#0088ff';
      case ItemRarity.EPIC: return '#aa00ff';
      case ItemRarity.LEGENDARY: return '#ffaa00';
      default: return '#ffffff';
    }
  }

  /**
   * Setup input event handlers
   */
  private setupInputHandling(): void {
    document.addEventListener('keydown', (event) => {
      if (this.isOpen) {
        this.keysPressed.add(event.code);
        event.preventDefault();
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keysPressed.delete(event.code);
    });
  }
  
  /**
   * Toggle inventory visibility
   */
  toggleVisibility(): void {
    this.isOpen = !this.isOpen;
  }
  
  /**
   * Set inventory visibility
   */
  setVisibility(visible: boolean): void {
    this.isOpen = visible;
  }
  
  /**
   * Check if inventory is open
   */
  isVisible(): boolean {
    return this.isOpen;
  }
}
