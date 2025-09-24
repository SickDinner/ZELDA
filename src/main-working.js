console.log('🎮 Working JRPG Framework starting (JavaScript version)...');

class WorkingGame {
  constructor() {
    console.log('🎯 WorkingGame constructor');
    
    // Get canvas
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) {
      console.error('❌ Canvas not found!');
      return;
    }
    console.log('✅ Canvas found');

    // Get context
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error('❌ Canvas context failed!');
      return;
    }
    console.log('✅ Canvas context ready');

    this.running = false;
    this.frame = 0;
    
    // Initialize immediately
    this.initialize();
  }

  initialize() {
    console.log('🚀 Initializing game...');
    
    // Test render first
    this.testRender();
    
    // Start game loop
    this.start();
    
    console.log('✅ Game initialized');
  }

  testRender() {
    console.log('🎨 Test rendering...');
    
    // Purple background
    this.ctx.fillStyle = '#6644aa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // White text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px monospace';
    this.ctx.fillText('WORKING JRPG FRAMEWORK', 50, 50);
    this.ctx.fillText('JavaScript Version - SUCCESS!', 50, 100);
    
    // Colored squares
    this.ctx.fillStyle = '#ff4444';
    this.ctx.fillRect(100, 150, 64, 64);
    
    this.ctx.fillStyle = '#44ff44';
    this.ctx.fillRect(200, 150, 64, 64);
    
    this.ctx.fillStyle = '#4444ff';
    this.ctx.fillRect(300, 150, 64, 64);
    
    console.log('✅ Test render complete');
  }

  start() {
    console.log('🚀 Starting game loop...');
    this.running = true;
    this.gameLoop();
  }

  gameLoop() {
    if (!this.running) return;
    
    const time = Date.now() / 1000;
    
    // Clear with dark blue background
    this.ctx.fillStyle = '#1a1a4a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px monospace';
    this.ctx.fillText('SNES JRPG Framework - Working Version', 50, 50);
    this.ctx.fillText('Animation and rendering working!', 50, 80);
    
    // Moving player sprite (yellow circle)
    const playerX = 300 + Math.sin(time * 2) * 100;
    const playerY = 200 + Math.cos(time * 1.5) * 50;
    
    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();
    this.ctx.arc(playerX, playerY, 16, 0, Math.PI * 2);
    this.ctx.fill();
    
    // NPC sprite (green circle)
    this.ctx.fillStyle = '#00ff88';
    this.ctx.beginPath();
    this.ctx.arc(500, 300, 16, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Ground tiles (grid pattern)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x < this.canvas.width; x += 32) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y < this.canvas.height; y += 32) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    // Controls text
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('Controls: WASD to move (simulated)', 50, this.canvas.height - 60);
    this.ctx.fillText('Yellow circle = Player | Green circle = NPC', 50, this.canvas.height - 40);
    
    // Frame counter
    this.ctx.fillStyle = '#888888';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Frame: ${this.frame++}`, 50, this.canvas.height - 10);
    this.ctx.fillText(`Time: ${time.toFixed(1)}s`, 150, this.canvas.height - 10);
    
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 DOM loaded, creating WorkingGame...');
  
  try {
    const game = new WorkingGame();
    window.__workingGame = game;
    console.log('✅ WorkingGame created successfully!');
  } catch (error) {
    console.error('❌ WorkingGame failed:', error);
  }
});