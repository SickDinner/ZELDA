import { Vec2 } from '@core/math/Vec2.js';
import { Rect } from '@core/math/Rect.js';

export interface TextureAtlasData {
  frames: Record<string, {
    frame: { x: number; y: number; w: number; h: number };
    rotated: boolean;
    trimmed: boolean;
    spriteSourceSize: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
  }>;
  meta: {
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: string;
  };
}

export interface Texture {
  id: string;
  image: HTMLImageElement;
  width: number;
  height: number;
  frames: Map<string, Rect>; // Frame name -> UV coordinates
}

export interface SpriteFrame {
  texture: Texture;
  frame: Rect;
  anchor: Vec2;
}

export class AssetManager {
  private static instance: AssetManager | null = null;
  
  private textures = new Map<string, Texture>();
  private loadingPromises = new Map<string, Promise<Texture>>();
  private spriteFrames = new Map<string, SpriteFrame>();

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Load a single image as a texture
   */
  public async loadTexture(id: string, imagePath: string): Promise<Texture> {
    if (this.textures.has(id)) {
      return this.textures.get(id)!;
    }

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    const promise = new Promise<Texture>((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => {
        const texture: Texture = {
          id,
          image,
          width: image.width,
          height: image.height,
          frames: new Map()
        };
        
        // Add default full-image frame
        texture.frames.set('default', new Rect(0, 0, image.width, image.height));
        
        this.textures.set(id, texture);
        this.loadingPromises.delete(id);
        
        console.log(`✅ Loaded texture: ${id} (${image.width}x${image.height})`);
        resolve(texture);
      };

      image.onerror = () => {
        this.loadingPromises.delete(id);
        reject(new Error(`Failed to load image: ${imagePath}`));
      };

      image.src = imagePath;
    });

    this.loadingPromises.set(id, promise);
    return promise;
  }

  /**
   * Load a texture atlas with frame data (e.g., from Kenney assets)
   */
  public async loadTextureAtlas(
    textureId: string,
    imagePath: string,
    atlasData: TextureAtlasData
  ): Promise<Texture> {
    const texture = await this.loadTexture(textureId, imagePath);
    
    // Parse atlas frames
    texture.frames.clear(); // Remove default frame
    
    for (const [frameName, frameData] of Object.entries(atlasData.frames)) {
      const frame = new Rect(
        frameData.frame.x,
        frameData.frame.y,
        frameData.frame.w,
        frameData.frame.h
      );
      
      texture.frames.set(frameName, frame);
      
      // Create sprite frame with default anchor point
      const spriteFrame: SpriteFrame = {
        texture,
        frame,
        anchor: new Vec2(0.5, 0.5) // Center anchor by default
      };
      
      this.spriteFrames.set(frameName, spriteFrame);
    }

    console.log(`✅ Loaded texture atlas: ${textureId} with ${texture.frames.size} frames`);
    return texture;
  }

  /**
   * Load Kenney-style sprite atlas from JSON file
   */
  public async loadKenneyAtlas(
    textureId: string,
    imagePath: string,
    jsonPath: string
  ): Promise<Texture> {
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) {
        throw new Error(`Failed to load atlas JSON: ${jsonPath}`);
      }
      
      const atlasData: TextureAtlasData = await response.json();
      return await this.loadTextureAtlas(textureId, imagePath, atlasData);
    } catch (error) {
      console.error(`❌ Failed to load Kenney atlas: ${textureId}`, error);
      throw error;
    }
  }

  /**
   * Get a loaded texture by ID
   */
  public getTexture(id: string): Texture | undefined {
    return this.textures.get(id);
  }

  /**
   * Get a sprite frame by name
   */
  public getSpriteFrame(frameName: string): SpriteFrame | undefined {
    return this.spriteFrames.get(frameName);
  }

  /**
   * Create a custom sprite frame
   */
  public createSpriteFrame(
    frameName: string,
    textureId: string,
    frame: Rect,
    anchor: Vec2 = new Vec2(0.5, 0.5)
  ): SpriteFrame | undefined {
    const texture = this.getTexture(textureId);
    if (!texture) {
      console.error(`❌ Texture not found: ${textureId}`);
      return undefined;
    }

    const spriteFrame: SpriteFrame = {
      texture,
      frame,
      anchor
    };

    this.spriteFrames.set(frameName, spriteFrame);
    return spriteFrame;
  }

  /**
   * Check if an asset is loaded
   */
  public isLoaded(id: string): boolean {
    return this.textures.has(id);
  }

  /**
   * Check if an asset is currently loading
   */
  public isLoading(id: string): boolean {
    return this.loadingPromises.has(id);
  }

  /**
   * Get all loaded texture IDs
   */
  public getLoadedTextures(): string[] {
    return Array.from(this.textures.keys());
  }

  /**
   * Get all available sprite frames
   */
  public getAvailableFrames(): string[] {
    return Array.from(this.spriteFrames.keys());
  }

  /**
   * Preload multiple Kenney assets
   */
  public async preloadKenneyAssets(assets: Array<{
    id: string;
    imagePath: string;
    jsonPath?: string;
  }>): Promise<Texture[]> {
    const promises = assets.map(asset => {
      if (asset.jsonPath) {
        return this.loadKenneyAtlas(asset.id, asset.imagePath, asset.jsonPath);
      } else {
        return this.loadTexture(asset.id, asset.imagePath);
      }
    });

    const results = await Promise.allSettled(promises);
    const successful: Texture[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        console.error(`❌ Failed to load asset ${assets[index].id}:`, result.reason);
      }
    });

    console.log(`✅ Preloaded ${successful.length}/${assets.length} Kenney assets`);
    return successful;
  }

  /**
   * Clear all loaded assets (useful for cleanup)
   */
  public clear(): void {
    this.textures.clear();
    this.loadingPromises.clear();
    this.spriteFrames.clear();
    console.log('🧹 AssetManager cleared');
  }
}