import { AssetManager } from './AssetManager';

/**
 * Categories of Kenney assets available in the sprites directory
 */
export enum KenneyAssetCategory {
  CHARACTERS = 'Characters',
  ELEMENTS = 'Elements',
  ALIENS = 'Aliens',
  CARS = 'Cars',
  PROPS = 'Props',
  EQUIPMENT = 'Equipment',
  BACKGROUNDS = 'Backgrounds',
  DEBRIS = 'Debris',
  EXPLOSION = 'Explosion',
  TILES = 'Tiles'
}

/**
 * Asset definition for Kenney sprites
 */
export interface KenneyAssetDefinition {
  id: string;
  category: KenneyAssetCategory;
  filename: string;
  path: string;
  tags?: string[];
  animationFrames?: string[]; // For animated sprites
  size?: { width: number; height: number };
}

/**
 * Enhanced asset manager specifically for Kenney sprite assets
 * Provides organized loading and management of the extensive Kenney asset library
 */
export class KenneyAssetManager {
  private assetManager: AssetManager;
  private kenneyAssets: Map<string, KenneyAssetDefinition> = new Map();
  private loadedCategories: Set<KenneyAssetCategory> = new Set();
  
  // Base path to Kenney assets (web-accessible path)
  private readonly BASE_PATH = '/assets';
  
  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
    this.initializeAssetDefinitions();
  }

  /**
   * Initialize predefined asset definitions for commonly used Kenney sprites
   */
  private initializeAssetDefinitions(): void {
    // Character assets
    const characterAssets: KenneyAssetDefinition[] = [
      {
        id: 'man_idle',
        category: KenneyAssetCategory.CHARACTERS,
        filename: 'man.png',
        path: `${this.BASE_PATH}/man.png`,
        tags: ['player', 'male', 'idle'],
        size: { width: 16, height: 16 }
      },
      {
        id: 'man_walk1',
        category: KenneyAssetCategory.CHARACTERS,
        filename: 'man_walk1.png',
        path: `${this.BASE_PATH}/man_walk1.png`,
        tags: ['player', 'male', 'walk', 'animation'],
        size: { width: 16, height: 16 }
      },
      {
        id: 'man_walk2',
        category: KenneyAssetCategory.CHARACTERS,
        filename: 'man_walk2.png',
        path: `${this.BASE_PATH}/man_walk2.png`,
        tags: ['player', 'male', 'walk', 'animation'],
        size: { width: 16, height: 16 }
      },
      {
        id: 'woman_idle',
        category: KenneyAssetCategory.CHARACTERS,
        filename: 'woman.png',
        path: `${this.BASE_PATH}/woman.png`,
        tags: ['player', 'female', 'idle'],
        size: { width: 16, height: 16 }
      }
    ];

    // Element assets
    const elementAssets: KenneyAssetDefinition[] = [];
    for (let i = 1; i <= 50; i++) {
      elementAssets.push({
        id: `element_${i}`,
        category: KenneyAssetCategory.ELEMENTS,
        filename: `element (${i}).png`,
        path: `${this.BASE_PATH}/element (${i}).png`,
        tags: ['environment', 'decoration'],
        size: { width: 16, height: 16 }
      });
    }

    // Alien/Enemy assets
    const alienAssets: KenneyAssetDefinition[] = [
      'alienBeige', 'alienBlue', 'alienGreen', 'alienPink', 'alienYellow'
    ].flatMap(color => [
      {
        id: `${color}_round`,
        category: KenneyAssetCategory.ALIENS,
        filename: `${color}_round.png`,
        path: `${this.BASE_PATH}/${color}_round.png`,
        tags: ['enemy', 'alien', color.replace('alien', '').toLowerCase(), 'round'],
        size: { width: 16, height: 16 }
      },
      {
        id: `${color}_square`,
        category: KenneyAssetCategory.ALIENS,
        filename: `${color}_square.png`,
        path: `${this.BASE_PATH}/${color}_square.png`,
        tags: ['enemy', 'alien', color.replace('alien', '').toLowerCase(), 'square'],
        size: { width: 16, height: 16 }
      },
      {
        id: `${color}_suit`,
        category: KenneyAssetCategory.ALIENS,
        filename: `${color}_suit.png`,
        path: `${this.BASE_PATH}/${color}_suit.png`,
        tags: ['enemy', 'alien', color.replace('alien', '').toLowerCase(), 'suit'],
        size: { width: 16, height: 16 }
      }
    ]);

    // Register all assets
    [...characterAssets, ...elementAssets, ...alienAssets].forEach(asset => {
      this.kenneyAssets.set(asset.id, asset);
    });
  }

  /**
   * Load all assets from a specific category
   */
  async loadCategory(category: KenneyAssetCategory): Promise<void> {
    if (this.loadedCategories.has(category)) {
      console.log(`Category ${category} already loaded`);
      return;
    }

    const categoryAssets = Array.from(this.kenneyAssets.values())
      .filter(asset => asset.category === category);

    console.log(`Loading ${categoryAssets.length} assets from category: ${category}`);

    const loadPromises = categoryAssets.map(async asset => {
      try {
        await this.assetManager.loadTexture(asset.id, asset.path);
      } catch (error) {
        console.warn(`Failed to load asset ${asset.id}:`, error);
      }
    });

    await Promise.all(loadPromises);
    this.loadedCategories.add(category);
    console.log(`Category ${category} loaded successfully`);
  }

  /**
   * Load specific assets by their IDs
   */
  async loadAssets(assetIds: string[]): Promise<void> {
    const loadPromises = assetIds.map(async id => {
      const asset = this.kenneyAssets.get(id);
      if (!asset) {
        console.warn(`Asset ${id} not found in definitions`);
        return;
      }

      try {
        await this.assetManager.loadTexture(id, asset.path);
      } catch (error) {
        console.warn(`Failed to load asset ${id}:`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category: KenneyAssetCategory): KenneyAssetDefinition[] {
    return Array.from(this.kenneyAssets.values())
      .filter(asset => asset.category === category);
  }

  /**
   * Get assets by tags
   */
  getAssetsByTags(tags: string[]): KenneyAssetDefinition[] {
    return Array.from(this.kenneyAssets.values())
      .filter(asset => 
        asset.tags && tags.some(tag => asset.tags!.includes(tag))
      );
  }

  /**
   * Get asset definition by ID
   */
  getAssetDefinition(id: string): KenneyAssetDefinition | undefined {
    return this.kenneyAssets.get(id);
  }

  /**
   * Check if a category is loaded
   */
  isCategoryLoaded(category: KenneyAssetCategory): boolean {
    return this.loadedCategories.has(category);
  }

  /**
   * Get all available asset IDs
   */
  getAllAssetIds(): string[] {
    return Array.from(this.kenneyAssets.keys());
  }

  /**
   * Get loaded categories
   */
  getLoadedCategories(): KenneyAssetCategory[] {
    return Array.from(this.loadedCategories);
  }

  /**
   * Preload commonly used assets for a JRPG game
   */
  async preloadJRPGAssets(): Promise<void> {
    console.log('Preloading essential JRPG assets...');
    
    // Load character assets first
    await this.loadCategory(KenneyAssetCategory.CHARACTERS);
    
    // Load some elements for environment
    await this.loadAssets([
      'element_1', 'element_2', 'element_3', 'element_4', 'element_5',
      'element_10', 'element_15', 'element_20'
    ]);
    
    // Load some aliens as enemies
    await this.loadAssets([
      'alienGreen_round', 'alienPink_square', 'alienBlue_suit',
      'alienBeige_round', 'alienYellow_square'
    ]);
    
    console.log('JRPG assets preloaded successfully');
  }

  /**
   * Get texture from the underlying asset manager
   */
  getTexture(id: string): HTMLImageElement | undefined {
    const texture = this.assetManager.getTexture(id);
    return texture?.image;
  }

  /**
   * Create animation frames for an asset
   */
  createAnimationFrames(baseId: string): HTMLImageElement[] {
    const asset = this.kenneyAssets.get(baseId);
    if (!asset || !asset.animationFrames) {
      const texture = this.getTexture(baseId);
      return texture ? [texture] : [];
    }

    return asset.animationFrames
      .map(frame => frame.replace('.png', ''))
      .map(frameId => this.getTexture(`${baseId.split('_')[0]}_${frameId}`))
      .filter((texture): texture is HTMLImageElement => texture !== undefined);
  }
}