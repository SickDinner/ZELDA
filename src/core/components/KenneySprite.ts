import { Component } from '../ecs/Component';
import { KenneyAssetManager, KenneyAssetCategory } from '../assets/KenneyAssetManager';

/**
 * Sprite rendering modes for different visual styles
 */
export enum SpriteRenderMode {
  NORMAL = 'normal',
  PIXELATED = 'pixelated',
  SMOOTH = 'smooth',
  RETRO = 'retro'
}

/**
 * Sprite effects for visual enhancement
 */
export interface SpriteEffects {
  tint?: string;           // Color tint overlay
  alpha?: number;          // Transparency (0-1)
  glow?: boolean;          // Glow effect
  shadow?: boolean;        // Drop shadow
  outline?: string;        // Outline color
  flipX?: boolean;         // Horizontal flip
  flipY?: boolean;         // Vertical flip
  rotation?: number;       // Rotation in radians
  scale?: { x: number; y: number }; // Scale factors
}

/**
 * Enhanced sprite component specifically designed for Kenney assets
 * Provides rich rendering options and easy asset management
 */
export class KenneySprite implements Component {
  public readonly __componentType: string = 'KenneySprite';
  public assetId: string;
  public texture: HTMLImageElement | null = null;
  public width: number;
  public height: number;
  public renderMode: SpriteRenderMode = SpriteRenderMode.PIXELATED;
  public effects: SpriteEffects = {};
  public layer: number = 0;        // Rendering layer (higher = front)
  public visible: boolean = true;
  public category: KenneyAssetCategory;
  
  // Animation support
  public animationFrames: HTMLImageElement[] = [];
  public currentFrame: number = 0;
  public animationSpeed: number = 200; // ms per frame
  public isAnimated: boolean = false;
  public lastFrameTime: number = 0;
  
  // Offset for precise positioning
  public offset: { x: number; y: number } = { x: 0, y: 0 };
  
  constructor(
    assetId: string, 
    width: number = 16, 
    height: number = 16,
    category: KenneyAssetCategory = KenneyAssetCategory.CHARACTERS
  ) {
    this.assetId = assetId;
    this.width = width;
    this.height = height;
    this.category = category;
  }

  /**
   * Initialize the sprite with texture from asset manager
   */
  async initialize(kenneyAssetManager: KenneyAssetManager): Promise<void> {
    this.texture = kenneyAssetManager.getTexture(this.assetId) || null;
    
    if (!this.texture) {
      console.warn(`Texture ${this.assetId} not found, attempting to load...`);
      try {
        await kenneyAssetManager.loadAssets([this.assetId]);
        this.texture = kenneyAssetManager.getTexture(this.assetId) || null;
      } catch (error) {
        console.error(`Failed to load texture ${this.assetId}:`, error);
        return;
      }
    }

    // Setup animation frames if available
    const assetDef = kenneyAssetManager.getAssetDefinition(this.assetId);
    if (assetDef?.animationFrames && assetDef.animationFrames.length > 0) {
      this.animationFrames = kenneyAssetManager.createAnimationFrames(this.assetId);
      this.isAnimated = this.animationFrames.length > 1;
    } else if (this.texture) {
      this.animationFrames = [this.texture];
    }

    // Set dimensions from asset definition if available
    if (assetDef?.size) {
      this.width = assetDef.size.width;
      this.height = assetDef.size.height;
    }
  }

  /**
   * Update animation frame
   */
  updateAnimation(deltaTime: number): void {
    if (!this.isAnimated || this.animationFrames.length <= 1) return;

    this.lastFrameTime += deltaTime;
    if (this.lastFrameTime >= this.animationSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.animationFrames.length;
      this.texture = this.animationFrames[this.currentFrame];
      this.lastFrameTime = 0;
    }
  }

  /**
   * Set sprite tint color
   */
  setTint(color: string): void {
    this.effects.tint = color;
  }

  /**
   * Set sprite transparency
   */
  setAlpha(alpha: number): void {
    this.effects.alpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * Enable/disable glow effect
   */
  setGlow(enabled: boolean): void {
    this.effects.glow = enabled;
  }

  /**
   * Set sprite scale
   */
  setScale(x: number, y: number = x): void {
    this.effects.scale = { x, y };
  }

  /**
   * Set sprite rotation
   */
  setRotation(radians: number): void {
    this.effects.rotation = radians;
  }

  /**
   * Flip sprite horizontally or vertically
   */
  setFlip(flipX: boolean, flipY: boolean = false): void {
    this.effects.flipX = flipX;
    this.effects.flipY = flipY;
  }

  /**
   * Set rendering layer
   */
  setLayer(layer: number): void {
    this.layer = layer;
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Change the asset ID and reinitialize
   */
  async changeAsset(assetId: string, kenneyAssetManager: KenneyAssetManager): Promise<void> {
    this.assetId = assetId;
    this.currentFrame = 0;
    this.lastFrameTime = 0;
    await this.initialize(kenneyAssetManager);
  }

  /**
   * Get current texture for rendering
   */
  getCurrentTexture(): HTMLImageElement | null {
    if (this.isAnimated && this.animationFrames.length > 0) {
      return this.animationFrames[this.currentFrame];
    }
    return this.texture;
  }

  /**
   * Apply visual effects to canvas context
   */
  applyEffects(ctx: CanvasRenderingContext2D): void {
    // Apply alpha
    if (this.effects.alpha !== undefined) {
      ctx.globalAlpha = this.effects.alpha;
    }

    // Apply tint using composite operations
    if (this.effects.tint) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = this.effects.tint;
    }

    // Apply shadow
    if (this.effects.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    // Apply glow
    if (this.effects.glow) {
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 8;
    }
  }

  /**
   * Reset canvas effects
   */
  resetEffects(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * Render the sprite to canvas
   */
  render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (!this.visible || !this.texture) return;

    const texture = this.getCurrentTexture();
    if (!texture) return;

    ctx.save();

    // Apply transformations
    const centerX = x + this.width / 2 + this.offset.x;
    const centerY = y + this.height / 2 + this.offset.y;
    
    ctx.translate(centerX, centerY);

    // Apply rotation
    if (this.effects.rotation) {
      ctx.rotate(this.effects.rotation);
    }

    // Apply scale
    if (this.effects.scale) {
      ctx.scale(this.effects.scale.x, this.effects.scale.y);
    }

    // Apply flip
    if (this.effects.flipX || this.effects.flipY) {
      ctx.scale(
        this.effects.flipX ? -1 : 1,
        this.effects.flipY ? -1 : 1
      );
    }

    // Set render mode
    if (this.renderMode === SpriteRenderMode.PIXELATED) {
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.imageSmoothingEnabled = true;
    }

    // Apply visual effects
    this.applyEffects(ctx);

    // Render the sprite centered
    ctx.drawImage(
      texture,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    // Apply tint overlay if needed
    if (this.effects.tint) {
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    // Reset effects
    this.resetEffects(ctx);

    ctx.restore();
  }

  /**
   * Get sprite bounds for collision detection
   */
  getBounds(x: number, y: number): { 
    left: number; 
    right: number; 
    top: number; 
    bottom: number; 
  } {
    return {
      left: x + this.offset.x,
      right: x + this.width + this.offset.x,
      top: y + this.offset.y,
      bottom: y + this.height + this.offset.y
    };
  }

  /**
   * Check if point is within sprite bounds
   */
  containsPoint(spriteX: number, spriteY: number, pointX: number, pointY: number): boolean {
    const bounds = this.getBounds(spriteX, spriteY);
    return pointX >= bounds.left && 
           pointX <= bounds.right && 
           pointY >= bounds.top && 
           pointY <= bounds.bottom;
  }
}