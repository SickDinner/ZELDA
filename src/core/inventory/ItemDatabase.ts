import { ItemDefinition, ItemType, ItemRarity, ItemEffectType, EquipmentSlot } from './InventorySystem';

/**
 * Predefined item database for common JRPG items
 */
export class ItemDatabase {
  private static items: Map<string, ItemDefinition> = new Map();

  /**
   * Initialize the item database with predefined items
   */
  static initialize(): void {
    // Consumables
    this.registerItem({
      id: 'health_potion_small',
      name: 'Health Potion',
      description: 'A small red potion that restores 50 HP.',
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      icon: 'element_1', // Using Kenney elements for now
      value: 25,
      maxStack: 99,
      isConsumable: true,
      isEquippable: false,
      effects: [
        {
          type: ItemEffectType.HEAL_HP,
          value: 50,
          target: 'self',
          description: 'Restores 50 HP'
        }
      ],
      tags: ['healing', 'consumable']
    });

    this.registerItem({
      id: 'mana_potion_small',
      name: 'Mana Potion',
      description: 'A blue potion that restores 30 MP.',
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      icon: 'element_2',
      value: 30,
      maxStack: 99,
      isConsumable: true,
      isEquippable: false,
      effects: [
        {
          type: ItemEffectType.HEAL_MP,
          value: 30,
          target: 'self',
          description: 'Restores 30 MP'
        }
      ],
      tags: ['mana', 'consumable']
    });

    this.registerItem({
      id: 'strength_elixir',
      name: 'Strength Elixir',
      description: 'A powerful elixir that temporarily boosts attack power.',
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.UNCOMMON,
      icon: 'element_3',
      value: 75,
      maxStack: 20,
      isConsumable: true,
      isEquippable: false,
      effects: [
        {
          type: ItemEffectType.BUFF_ATTACK,
          value: 10,
          duration: 300,
          target: 'self',
          description: '+10 Attack for 5 minutes'
        }
      ],
      tags: ['buff', 'consumable', 'combat']
    });

    // Weapons
    this.registerItem({
      id: 'iron_sword',
      name: 'Iron Sword',
      description: 'A sturdy iron blade. Reliable and sharp.',
      type: ItemType.WEAPON,
      rarity: ItemRarity.COMMON,
      icon: 'element_10',
      value: 150,
      maxStack: 1,
      isConsumable: false,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.WEAPON,
      effects: [
        {
          type: ItemEffectType.BUFF_ATTACK,
          value: 15,
          description: '+15 Attack Power'
        }
      ],
      requirements: {
        level: 5
      },
      tags: ['weapon', 'sword', 'metal']
    });

    this.registerItem({
      id: 'steel_sword',
      name: 'Steel Sword',
      description: 'A well-forged steel sword with excellent balance.',
      type: ItemType.WEAPON,
      rarity: ItemRarity.UNCOMMON,
      icon: 'element_11',
      value: 300,
      maxStack: 1,
      isConsumable: false,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.WEAPON,
      effects: [
        {
          type: ItemEffectType.BUFF_ATTACK,
          value: 25,
          description: '+25 Attack Power'
        }
      ],
      requirements: {
        level: 12
      },
      tags: ['weapon', 'sword', 'metal']
    });

    this.registerItem({
      id: 'flame_sword',
      name: 'Flame Sword',
      description: 'A magical sword imbued with the power of fire.',
      type: ItemType.WEAPON,
      rarity: ItemRarity.RARE,
      icon: 'element_12',
      value: 750,
      maxStack: 1,
      isConsumable: false,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.WEAPON,
      effects: [
        {
          type: ItemEffectType.BUFF_ATTACK,
          value: 40,
          description: '+40 Attack Power'
        },
        {
          type: ItemEffectType.CUSTOM,
          value: 0,
          description: 'Fire damage over time'
        }
      ],
      requirements: {
        level: 20
      },
      tags: ['weapon', 'sword', 'magical', 'fire']
    });

    // Armor
    this.registerItem({
      id: 'leather_armor',
      name: 'Leather Armor',
      description: 'Basic leather protection for adventurers.',
      type: ItemType.ARMOR,
      rarity: ItemRarity.COMMON,
      icon: 'element_15',
      value: 100,
      maxStack: 1,
      isConsumable: false,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.ARMOR,
      effects: [
        {
          type: ItemEffectType.BUFF_DEFENSE,
          value: 8,
          description: '+8 Defense'
        }
      ],
      requirements: {
        level: 3
      },
      tags: ['armor', 'leather', 'light']
    });

    this.registerItem({
      id: 'chainmail',
      name: 'Chainmail',
      description: 'Interlocking metal rings provide solid protection.',
      type: ItemType.ARMOR,
      rarity: ItemRarity.UNCOMMON,
      icon: 'element_16',
      value: 250,
      maxStack: 1,
      isConsumable: false,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.ARMOR,
      effects: [
        {
          type: ItemEffectType.BUFF_DEFENSE,
          value: 15,
          description: '+15 Defense'
        }
      ],
      requirements: {
        level: 10
      },
      tags: ['armor', 'metal', 'medium']
    });

    // Accessories
    this.registerItem({
      id: 'speed_ring',
      name: 'Ring of Speed',
      description: 'A magical ring that increases movement speed.',
      type: ItemType.ACCESSORY,
      rarity: ItemRarity.RARE,
      icon: 'element_20',
      value: 500,
      maxStack: 1,
      isConsumable: false,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.ACCESSORY_1,
      effects: [
        {
          type: ItemEffectType.BUFF_SPEED,
          value: 25,
          description: '+25% Movement Speed'
        }
      ],
      requirements: {
        level: 15
      },
      tags: ['accessory', 'ring', 'magical', 'speed']
    });

    // Key Items
    this.registerItem({
      id: 'ancient_key',
      name: 'Ancient Key',
      description: 'An ornate key that seems to pulse with mysterious energy.',
      type: ItemType.KEY_ITEM,
      rarity: ItemRarity.LEGENDARY,
      icon: 'element_25',
      value: 0, // Priceless
      maxStack: 1,
      isConsumable: false,
      isEquippable: false,
      tags: ['key', 'ancient', 'quest']
    });

    // Materials
    this.registerItem({
      id: 'iron_ore',
      name: 'Iron Ore',
      description: 'Raw iron ore. Can be smelted into ingots.',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.COMMON,
      icon: 'element_30',
      value: 10,
      maxStack: 99,
      isConsumable: false,
      isEquippable: false,
      tags: ['material', 'ore', 'crafting']
    });

    this.registerItem({
      id: 'magic_crystal',
      name: 'Magic Crystal',
      description: 'A glowing crystal containing pure magical energy.',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.EPIC,
      icon: 'element_31',
      value: 200,
      maxStack: 50,
      isConsumable: false,
      isEquippable: false,
      tags: ['material', 'crystal', 'magical', 'crafting']
    });

    // Treasure
    this.registerItem({
      id: 'gold_coin',
      name: 'Gold Coin',
      description: 'A shiny gold coin. Universal currency.',
      type: ItemType.TREASURE,
      rarity: ItemRarity.COMMON,
      icon: 'element_35',
      value: 1,
      maxStack: 9999,
      isConsumable: false,
      isEquippable: false,
      tags: ['treasure', 'currency', 'gold']
    });

    this.registerItem({
      id: 'ruby_gem',
      name: 'Ruby Gem',
      description: 'A precious red ruby. Highly valuable.',
      type: ItemType.TREASURE,
      rarity: ItemRarity.RARE,
      icon: 'element_36',
      value: 500,
      maxStack: 99,
      isConsumable: false,
      isEquippable: false,
      tags: ['treasure', 'gem', 'precious']
    });

    console.log(`📦 Initialized item database with ${this.items.size} items`);
  }

  /**
   * Register a new item in the database
   */
  static registerItem(item: ItemDefinition): void {
    this.items.set(item.id, item);
  }

  /**
   * Get an item definition by ID
   */
  static getItem(id: string): ItemDefinition | undefined {
    return this.items.get(id);
  }

  /**
   * Get all items of a specific type
   */
  static getItemsByType(type: ItemType): ItemDefinition[] {
    return Array.from(this.items.values()).filter(item => item.type === type);
  }

  /**
   * Get all items of a specific rarity
   */
  static getItemsByRarity(rarity: ItemRarity): ItemDefinition[] {
    return Array.from(this.items.values()).filter(item => item.rarity === rarity);
  }

  /**
   * Search items by name or description
   */
  static searchItems(query: string): ItemDefinition[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.items.values()).filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get all items with a specific tag
   */
  static getItemsByTag(tag: string): ItemDefinition[] {
    return Array.from(this.items.values()).filter(item =>
      item.tags?.includes(tag)
    );
  }

  /**
   * Get all registered items
   */
  static getAllItems(): ItemDefinition[] {
    return Array.from(this.items.values());
  }

  /**
   * Get a random item by rarity (useful for loot generation)
   */
  static getRandomItemByRarity(rarity: ItemRarity): ItemDefinition | undefined {
    const items = this.getItemsByRarity(rarity);
    if (items.length === 0) return undefined;
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Create a starter inventory set
   */
  static createStarterItems(): ItemDefinition[] {
    return [
      this.getItem('health_potion_small')!,
      this.getItem('health_potion_small')!, // Give 2 health potions
      this.getItem('mana_potion_small')!,
      this.getItem('iron_sword')!,
      this.getItem('leather_armor')!,
      this.getItem('gold_coin')!
    ].filter(Boolean); // Remove any undefined items
  }

  /**
   * Create a treasure chest reward set
   */
  static createTreasureChestReward(): ItemDefinition[] {
    const rewards: ItemDefinition[] = [];
    
    // Always give some gold
    rewards.push(this.getItem('gold_coin')!);
    
    // 70% chance for a health potion
    if (Math.random() < 0.7) {
      rewards.push(this.getItem('health_potion_small')!);
    }
    
    // 30% chance for a rare item
    if (Math.random() < 0.3) {
      const rareItem = this.getRandomItemByRarity(ItemRarity.RARE);
      if (rareItem) rewards.push(rareItem);
    }
    
    // 10% chance for magic crystal
    if (Math.random() < 0.1) {
      rewards.push(this.getItem('magic_crystal')!);
    }
    
    return rewards.filter(Boolean);
  }

  /**
   * Helper function to create custom consumable items
   */
  static createConsumable(
    id: string,
    name: string,
    description: string,
    rarity: ItemRarity,
    value: number,
    effects: { type: ItemEffectType; value: number; description: string }[]
  ): ItemDefinition {
    return {
      id,
      name,
      description,
      type: ItemType.CONSUMABLE,
      rarity,
      icon: 'element_1', // Default icon
      value,
      maxStack: 99,
      isConsumable: true,
      isEquippable: false,
      effects: effects.map(effect => ({
        ...effect,
        target: 'self' as const
      })),
      tags: ['consumable']
    };
  }

  /**
   * Helper function to create custom weapon items
   */
  static createWeapon(
    id: string,
    name: string,
    description: string,
    rarity: ItemRarity,
    value: number,
    attackPower: number,
    levelRequirement: number = 1
  ): ItemDefinition {
    return {
      id,
      name,
      description,
      type: ItemType.WEAPON,
      rarity,
      icon: 'element_10',
      value,
      maxStack: 1,
      isConsumable: false,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.WEAPON,
      effects: [
        {
          type: ItemEffectType.BUFF_ATTACK,
          value: attackPower,
          description: `+${attackPower} Attack Power`
        }
      ],
      requirements: {
        level: levelRequirement
      },
      tags: ['weapon']
    };
  }
}