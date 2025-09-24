import { Vec2 } from '@core/math/Vec2.js';
import { Rect } from '@core/math/Rect.js';
import { AssetManager, SpriteFrame } from '@core/assets/AssetManager.js';
import { Transform, Sprite } from '@core/ecs/components/CoreComponents.js';

export interface RenderOptions {
  pixelPerfect: boolean;
  smoothRotation: boolean;
  enableBlending: boolean;
  debugMode: boolean;
}

export class SpriteRenderer {
  private ctx: CanvasRenderingContext2D;
  private assetManager: AssetManager;
  private options: RenderOptions;

  constructor(
    ctx: CanvasRenderingContext2D,
    options: Partial<RenderOptions> = {}
  ) {
    this.ctx = ctx;
    this.assetManager = AssetManager.getInstance();
    this.options = {
      pixelPerfect: true,
      smoothRotation: true,
      enableBlending: true,
      debugMode: false,
      ...options
    };

    this.setupPixelPerfectRendering();
  }

  private setupPixelPerfectRendering(): void {
    if (this.options.pixelPerfect) {
      this.ctx.imageSmoothingEnabled = false;
      // Set specific smoothing properties for better browser support
      (this.ctx as any).webkitImageSmoothingEnabled = false;
      (this.ctx as any).mozImageSmoothingEnabled = false;
      (this.ctx as any).msImageSmoothingEnabled = false;
    }
  }

  /**
   * Render a sprite using Transform and Sprite components
   */
  public renderSprite(transform: Transform, sprite: Sprite): void {
    if (!sprite.visible) return;

    const spriteFrame = this.assetManager.getSpriteFrame(sprite.textureId);
    if (!spriteFrame) {
      if (this.options.debugMode) {
        this.renderMissingSprite(transform, sprite);
      }
      return;
    }

    this.renderSpriteFrame(spriteFrame, transform, sprite);
  }

  /**
   * Render a sprite frame with transform and sprite properties
   */
  public renderSpriteFrame(
    spriteFrame: SpriteFrame,
    transform: Transform,
    sprite: Sprite
  ): void {
    const { texture, frame } = spriteFrame;
    
    this.ctx.save();

    // Apply transform
    this.ctx.translate(transform.position.x, transform.position.y);
    
    if (transform.rotation !== 0) {
      if (this.options.smoothRotation) {
        // For smooth rotation, temporarily enable smoothing
        this.ctx.imageSmoothingEnabled = true;
      }
      this.ctx.rotate(transform.rotation);
    }
    
    this.ctx.scale(transform.scale.x, transform.scale.y);

    // Apply sprite properties
    this.ctx.globalAlpha = sprite.alpha;
    
    if (this.options.enableBlending) {
      // Apply tint using composite operation
      if (sprite.tint !== '#ffffff') {
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.fillStyle = sprite.tint;
      }
    }

    // Calculate draw position based on anchor
    const drawX = -frame.width * sprite.anchor.x;
    const drawY = -frame.height * sprite.anchor.y;

    // Handle flipping
    if (sprite.flipX || sprite.flipY) {
      let scaleX = sprite.flipX ? -1 : 1;
      let scaleY = sprite.flipY ? -1 : 1;
      
      this.ctx.scale(scaleX, scaleY);
    }

    // Draw the sprite
    this.ctx.drawImage(
      texture.image,
      frame.x, frame.y, frame.width, frame.height, // Source
      drawX, drawY, frame.width, frame.height       // Destination
    );

    // Apply tint overlay if needed
    if (this.options.enableBlending && sprite.tint !== '#ffffff') {
      this.ctx.globalCompositeOperation = 'source-atop';
      this.ctx.fillRect(drawX, drawY, frame.width, frame.height);
    }

    // Debug rendering
    if (this.options.debugMode) {
      this.renderDebugInfo(drawX, drawY, frame);
    }

    this.ctx.restore();
    
    // Reset pixel-perfect rendering
    if (this.options.pixelPerfect) {
      this.setupPixelPerfectRendering();
    }
  }

  /**
   * Render a sprite at a specific position with custom properties
   */
  public renderSpriteAtPosition(
    spriteFrame: SpriteFrame,
    position: Vec2,
    options: {
      rotation?: number;
      scale?: Vec2;
      anchor?: Vec2;
      alpha?: number;
      tint?: string;
      flipX?: boolean;
      flipY?: boolean;
    } = {}
  ): void {
    const transform = new Transform(
      position,
      options.rotation || 0,
      options.scale || new Vec2(1, 1)
    );

    const sprite = new Sprite(
      '', // textureId not needed for direct rendering
      spriteFrame.frame,
      options.anchor || spriteFrame.anchor,
      true, // visible
      0, // layer
      options.flipX || false,
      options.flipY || false,
      options.tint || '#ffffff',
      options.alpha !== undefined ? options.alpha : 1
    );

    this.renderSpriteFrame(spriteFrame, transform, sprite);
  }

  /**
   * Render text with pixel-perfect font
   */
  public renderPixelText(
    text: string,
    position: Vec2,
    options: {
      font?: string;
      size?: number;
      color?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
      outline?: { color: string; width: number };
    } = {}
  ): void {
    this.ctx.save();

    // Set font properties
    const fontSize = options.size || 16;
    const fontFamily = options.font || 'monospace';
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = options.color || '#ffffff';
    this.ctx.textAlign = options.align || 'left';
    this.ctx.textBaseline = options.baseline || 'top';

    // Draw outline if specified
    if (options.outline) {
      this.ctx.strokeStyle = options.outline.color;
      this.ctx.lineWidth = options.outline.width;
      this.ctx.strokeText(text, position.x, position.y);
    }

    // Draw main text
    this.ctx.fillText(text, position.x, position.y);

    this.ctx.restore();
  }

  /**
   * Apply SNES-style scanline effect
   */
  public applyScanlineEffect(intensity: number = 0.1): void {
    this.ctx.save();
    
    const canvas = this.ctx.canvas;
    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.fillStyle = `rgba(0, 0, 0, ${intensity})`;
    
    // Draw horizontal lines
    for (let y = 0; y < canvas.height; y += 2) {
      this.ctx.fillRect(0, y, canvas.width, 1);
    }
    
    this.ctx.restore();
  }

  /**
   * Apply CRT-style curve effect (simple version)
   */
  public applyCRTEffect(curvature: number = 0.02): void {
    // This would require more complex image processing
    // For now, just apply a subtle vignette effect
    const canvas = this.ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.max(canvas.width, canvas.height) / 2;
    
    this.ctx.save();
    
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${curvature})`);
    
    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    this.ctx.restore();
  }

  /**
   * Render missing sprite placeholder
   */
  private renderMissingSprite(transform: Transform, sprite: Sprite): void {
    this.ctx.save();
    
    this.ctx.translate(transform.position.x, transform.position.y);
    this.ctx.rotate(transform.rotation);
    this.ctx.scale(transform.scale.x, transform.scale.y);
    
    const size = 32; // Default size for missing sprites
    const drawX = -size * sprite.anchor.x;
    const drawY = -size * sprite.anchor.y;
    
    // Pink and black checkerboard pattern
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.fillRect(drawX, drawY, size, size);
    
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(drawX, drawY, size/2, size/2);
    this.ctx.fillRect(drawX + size/2, drawY + size/2, size/2, size/2);
    
    // Draw "?" in the center
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('?', drawX + size/2, drawY + size/2);
    
    this.ctx.restore();
  }

  /**
   * Render debug information
   */
  private renderDebugInfo(x: number, y: number, frame: Rect): void {
    this.ctx.save();
    
    // Draw sprite bounds
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, frame.width, frame.height);
    
    // Draw anchor point
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(-2, -2, 4, 4);
    
    this.ctx.restore();
  }

  /**
   * Update renderer options
   */
  public setOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
    this.setupPixelPerfectRendering();
  }

  /**
   * Get current renderer options
   */
  public getOptions(): RenderOptions {
    return { ...this.options };
  }
}