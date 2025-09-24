console.log('🎮 Simple JRPG Framework starting...');

class SimpleGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private running: boolean = false;

  constructor() {
    console.log('🎯 SimpleGame constructor called');
    
    // Get canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      console.error('❌ Canvas element not found!');
      throw new Error('Could not find game canvas element');
    }
    console.log('✅ Canvas found:', this.canvas);

    // Get context
    this.ctx = this.canvas.getContext('2d')!;
    if (!this.ctx) {
      console.error('❌ Canvas context failed!');
      throw new Error('Could not get 2D rendering context');
    }
    console.log('✅ Canvas context obtained');

    // Test render immediately
    this.testRender();
  }

  private testRender(): void {
    console.log('🎨 Testing render...');
    
    try {
      // Clear with purple background
      this.ctx.fillStyle = '#6644aa';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw some test shapes
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '24px monospace';
      this.ctx.fillText('SIMPLE JRPG TEST', 50, 50);
      this.ctx.fillText('If you see this, rendering works!', 50, 100);
      
      // Draw colored squares
      this.ctx.fillStyle = '#ff4444';
      this.ctx.fillRect(100, 150, 64, 64);
      
      this.ctx.fillStyle = '#44ff44';
      this.ctx.fillRect(200, 150, 64, 64);
      
      this.ctx.fillStyle = '#4444ff';
      this.ctx.fillRect(300, 150, 64, 64);
      
      console.log('✅ Test render completed');
      
    } catch (error) {
      console.error('❌ Test render failed:', error);
    }
  }

  public start(): void {
    console.log('🚀 SimpleGame starting...');
    this.running = true;
    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.running) return;
    
    // Simple animation
    const time = Date.now() / 1000;
    
    // Clear
    this.ctx.fillStyle = '#2a2a4a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Static text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px monospace';
    this.ctx.fillText('SNES JRPG Framework - Simple Mode', 50, 50);
    this.ctx.fillText('Animation working!', 50, 80);
    
    // Moving circle
    const x = 400 + Math.sin(time) * 100;
    const y = 300 + Math.cos(time * 1.5) * 50;
    
    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 20, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Frame counter
    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Time: ${time.toFixed(1)}s`, 50, this.canvas.height - 20);
    
    requestAnimationFrame(this.gameLoop);
  };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 DOM loaded, creating SimpleGame...');
  
  try {
    const game = new SimpleGame();
    game.start();
    console.log('✅ SimpleGame created and started successfully!');
    
    // Global access for debugging
    (window as any).__simpleGame = game;
    
  } catch (error) {
    console.error('❌ Failed to create SimpleGame:', error);
    
    // Try emergency canvas test
    setTimeout(() => {
      console.log('🚨 Attempting emergency canvas test...');
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px monospace';
          ctx.fillText('EMERGENCY MODE - RED BACKGROUND', 50, 100);
          console.log('🚨 Emergency render completed');
        } else {
          console.error('🚨 Emergency: Canvas context failed');
        }
      } else {
        console.error('🚨 Emergency: Canvas not found');
      }
    }, 100);
  }
});

export {};