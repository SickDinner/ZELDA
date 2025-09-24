import { GameLoop } from '@core/time/GameLoop.js';
import { globalScheduler } from '@core/time/Scheduler.js';
import { globalTweens } from '@core/time/Tween.js';
import { World } from '@core/ecs/World.js';
import { Transform, Sprite, Collider, DialogueComponent } from '@core/ecs/components/CoreComponents.js';
import { Vec2 } from '@core/math/Vec2.js';
import { Rect } from '@core/math/Rect.js';
import { AssetManager } from '@core/assets/AssetManager.js';
import { KenneyAssetManager, KenneyAssetCategory } from '@core/assets/KenneyAssetManager.js';
import { SpriteRenderer } from '@core/rendering/SpriteRenderer.js';
import { AudioManager } from '@core/audio/AudioManager.js';
import { CollisionSystem, CollisionLayers } from '@core/physics/CollisionSystem.js';
import { DialogueSystem } from '@core/dialogue/DialogueSystem.js';
import { DialogueBuilder } from '@core/dialogue/DialogueBuilder.js';
import { InventorySystem, ItemDatabase, ItemType, ItemRarity } from '@core/inventory/InventorySystem.js';
import { Animator, GridMovement, PlayerInput } from '@core/ecs/components/CoreComponents.js';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: World;
  private gameLoop: GameLoop;
  private assetManager: AssetManager;
  private kenneyAssetManager: KenneyAssetManager;
  private spriteRenderer: SpriteRenderer;
  private audioManager: AudioManager;
  private collisionSystem: CollisionSystem;
  private dialogueSystem: DialogueSystem;
  private inventorySystem: InventorySystem;
  private playerEntity: number | null = null;
  private keysPressed = new Set<string>();

  constructor() {
    // Initialize canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Could not find game canvas element');
    }

    this.ctx = this.canvas.getContext('2d')!;
    if (!this.ctx) {
      throw new Error('Could not get 2D rendering context');
    }

    // Initialize ECS world
    this.world = new World();

    // Initialize asset management
    this.assetManager = AssetManager.getInstance();
    this.kenneyAssetManager = new KenneyAssetManager(this.assetManager);
    this.spriteRenderer = new SpriteRenderer(this.ctx, {
      pixelPerfect: true,
      smoothRotation: true,
      enableBlending: true,
      debugMode: false
    });
    
    // Initialize audio management
    this.audioManager = AudioManager.getInstance();
    
    // Initialize collision system
    this.collisionSystem = new CollisionSystem(this.world);
    
    // Initialize dialogue system
    this.dialogueSystem = new DialogueSystem(this.canvas, {
      boxPosition: new Vec2(50, this.canvas.height - 180),
      boxWidth: this.canvas.width - 100,
      boxHeight: 120
    }, {
      onDialogueStart: (treeId) => {
        console.log('🎭 Dialogue started:', treeId);
        this.audioManager.playSFX('coin', { volume: 0.3 });
      },
      onDialogueEnd: (treeId) => {
        console.log('🎭 Dialogue ended:', treeId);
        this.audioManager.playSFX('beep', { volume: 0.2 });
      },
      onActionExecute: (action, context) => {
        console.log('🎬 Dialogue action:', action, context);
        this.handleDialogueAction(action, context);
      }
    });
    
    // Initialize inventory system
    this.inventorySystem = new InventorySystem(this.canvas, 40, {
      position: new Vec2(100, 100)
    }, {
      onItemAdded: (item, quantity) => {
        console.log(`🎁 Added ${quantity}x ${item.definition.name}`);
        this.audioManager.playSFX('coin', { volume: 0.4 });
      },
      onItemUsed: (item) => {
        console.log(`🧪 Used ${item.definition.name}`);
        this.audioManager.playSFX('powerup', { volume: 0.3 });
      },
      onItemEquipped: (item, slot) => {
        console.log(`⚔️ Equipped ${item.definition.name} to ${slot}`);
        this.audioManager.playSFX('jump', { volume: 0.3 });
      },
      onInventoryFull: () => {
        console.log('📦 Inventory is full!');
        this.audioManager.playSFX('hit', { volume: 0.2 });
      }
    });
    
    // Set up input handling
    this.setupInputHandling();

    // Initialize game loop
    this.gameLoop = new GameLoop({
      update: this.update.bind(this),
      render: this.render.bind(this)
    });

    // Initialize synchronously to avoid async issues
    this.initialize();
    console.log('🎯 Game initialization complete!');
  }

  private initialize(): void {
    console.log('🎮 SNES JRPG Framework initializing...');
    
    try {
      // Skip async asset loading and use immediate initialization
      console.log('📦 Using fallback sprites (no async loading)...');
      this.createFallbackSprites();
      
      // Initialize dialogue trees
      this.initializeDialogues();
      
      // Initialize item database with sample items
      this.initializeItemDatabase();
      
      // Create a test entity with loaded sprite
      this.createTestEntities();

      // Test scheduler
      globalScheduler.schedule(() => {
        console.log('⏰ Scheduler test: 2 seconds elapsed');
      }, 2);

      // Test repeating scheduler
      globalScheduler.scheduleRepeating(() => {
        console.log('🔄 Repeating every 5 seconds');
      }, 5);

      console.log('✅ Framework initialized successfully');
      console.log(`📊 Entity count: ${this.world.getEntityCount()}`);
      console.log(`📈 Component counts:`, this.world.getComponentCounts());
    } catch (error) {
      console.error('❌ Failed to initialize framework:', error);
    }
  }

  private async loadAssets(): Promise<void> {
    console.log('📦 Loading Kenney assets and audio...');
    
    // Load Kenney sprites using the enhanced asset manager
    await this.loadKenneySprites();
    
    // Load audio
    await this.loadAudio();
  }

  private async loadKenneySprites(): Promise<void> {
    try {
      console.log('🎨 Loading Kenney asset categories...');
      
      // Preload essential JRPG assets using the Kenney Asset Manager
      await this.kenneyAssetManager.preloadJRPGAssets();
      
      const loadedCategories = this.kenneyAssetManager.getLoadedCategories();
      console.log(`✅ Loaded ${loadedCategories.length} Kenney categories:`, loadedCategories);
      
      // List available assets
      const allAssets = this.kenneyAssetManager.getAllAssetIds();
      console.log(`📊 Available assets: ${allAssets.length} total`);
      
      // Show some examples of loaded assets
      const characterAssets = this.kenneyAssetManager.getAssetsByCategory(KenneyAssetCategory.CHARACTERS);
      console.log(`👤 Character assets: ${characterAssets.length}`);
      
      const elementAssets = this.kenneyAssetManager.getAssetsByCategory(KenneyAssetCategory.ELEMENTS);
      console.log(`🌍 Element assets: ${elementAssets.length}`);
      
    } catch (error) {
      console.warn('⚠️ Could not load Kenney assets:', error);
      console.log('🔄 Using fallback sprites...');
      this.createFallbackSprites();
    }
  }

  private async loadAudio(): Promise<void> {
    try {
      // Create some SNES-style procedural sounds
      this.audioManager.createSNESSound('coin', 'coin', 988, 0.3);
      this.audioManager.createSNESSound('jump', 'jump', 440, 0.2);
      this.audioManager.createSNESSound('hit', 'hit', 220, 0.15);
      this.audioManager.createSNESSound('powerup', 'powerup', 523, 0.4);
      this.audioManager.createSNESSound('beep', 'beep', 880, 0.1);
      
      console.log('🔊 Created SNES-style sound effects');
      
      // Optionally load external audio files if available
      // const audioFiles = [
      //   { id: 'bgm-overworld', src: '/assets/audio/overworld.ogg', category: 'music' as const },
      //   { id: 'sfx-footstep', src: '/assets/audio/footstep.wav', category: 'sfx' as const }
      // ];
      // await this.audioManager.preloadAudio(audioFiles);
    } catch (error) {
      console.warn('⚠️ Audio loading failed, continuing without audio');
    }
  }

  private createFallbackSprites(): void {
    // Create simple colored rectangle sprites as fallback
    console.log('🎨 Creating fallback sprites...');
    // We'll render these procedurally in the render method
  }
  
  private initializeDialogues(): void {
    console.log('🎭 Creating dialogue trees...');
    
    // Create a simple NPC dialogue
    const alienDialogue = DialogueBuilder.createBranchingConversation(
      'alien_encounter',
      'Alien Encounter',
      {
        greeting: {
          text: 'Greetings, human! I am a peaceful alien explorer from the planet Zephyr.',
          speaker: 'Zephyrian'
        },
        choices: [
          {
            text: 'Who are you?',
            response: {
              text: 'I am Zyx, a scout from the Galactic Federation. We come in peace to study your fascinating world!',
              speaker: 'Zyx'
            }
          },
          {
            text: 'What are you doing here?',
            response: {
              text: 'We are conducting research on Earth\'s biodiversity. Your planet is quite remarkable!',
              speaker: 'Zyx'
            }
          },
          {
            text: 'Can you teach me something?',
            response: {
              text: 'Here\'s a secret: Try pressing the C key for a surprise! Knowledge is the greatest treasure.',
              speaker: 'Zyx'
            },
            action: 'give_hint'
          },
          {
            text: 'Do you have anything for me?',
            response: {
              text: 'Ah yes! Take these healing potions as a gift from my world. Press I to check your inventory!',
              speaker: 'Zyx'
            },
            action: 'give_item'
          },
          {
            text: 'I must go now.',
            response: {
              text: 'Farewell, kind human. May the stars guide your path!',
              speaker: 'Zyx'
            }
          }
        ],
        farewell: {
          text: 'Live long and prosper! 🚀',
          speaker: 'Zyx'
        }
      }
    );
    
    this.dialogueSystem.registerDialogueTree(alienDialogue);
    
    // Create a simple tutorial dialogue
    const tutorialDialogue = DialogueBuilder.createSimpleConversation(
      'tutorial',
      'Tutorial',
      [
        {
          text: 'Welcome to the SNES-style JRPG Framework!',
          speaker: 'System'
        },
        {
          text: 'Use WASD or Arrow Keys to move around the world.',
          speaker: 'System'
        },
        {
          text: 'Press E to interact with NPCs and objects.',
          speaker: 'System'
        },
        {
          text: 'Press Space for actions and Enter to continue dialogues.',
          speaker: 'System'
        },
        {
          text: 'Have fun exploring!',
          speaker: 'System'
        }
      ]
    );
    
    this.dialogueSystem.registerDialogueTree(tutorialDialogue);
  }
  
  private initializeItemDatabase(): void {
    console.log('🎒 Setting up item database and inventory...');
    
    // Register consumable items
    ItemDatabase.register({
      id: 'health_potion',
      name: 'Health Potion',
      type: ItemType.CONSUMABLE,
      description: 'Restores 50 HP when consumed',
      value: 25,
      stackSize: 10,
      rarity: ItemRarity.COMMON,
      consumable: {
        effect: 'heal',
        power: 50,
        duration: 0
      }
    });
    
    ItemDatabase.register({
      id: 'mana_potion',
      name: 'Mana Potion',
      type: ItemType.CONSUMABLE,
      description: 'Restores 30 MP when consumed',
      value: 20,
      stackSize: 10,
      rarity: ItemRarity.COMMON,
      consumable: {
        effect: 'restore_mana',
        power: 30,
        duration: 0
      }
    });
    
    // Register weapons
    ItemDatabase.register({
      id: 'iron_sword',
      name: 'Iron Sword',
      type: ItemType.WEAPON,
      description: 'A sturdy iron blade. +10 Attack',
      value: 100,
      stackSize: 1,
      rarity: ItemRarity.UNCOMMON,
      equipment: {
        slot: 'weapon',
        stats: {
          attack: 10,
          defense: 0,
          magic: 0,
          speed: 0
        }
      }
    });
    
    ItemDatabase.register({
      id: 'steel_shield',
      name: 'Steel Shield',
      type: ItemType.ARMOR,
      description: 'A reliable steel shield. +8 Defense',
      value: 80,
      stackSize: 1,
      rarity: ItemRarity.UNCOMMON,
      equipment: {
        slot: 'shield',
        stats: {
          attack: 0,
          defense: 8,
          magic: 0,
          speed: -2
        }
      }
    });
    
    // Register key items
    ItemDatabase.register({
      id: 'ancient_key',
      name: 'Ancient Key',
      type: ItemType.KEY_ITEM,
      description: 'An ornate key that opens ancient locks',
      value: 0,
      stackSize: 1,
      rarity: ItemRarity.LEGENDARY
    });
    
    // Add some starter items to the inventory
    this.inventorySystem.addItem('health_potion', 3);
    this.inventorySystem.addItem('mana_potion', 2);
    this.inventorySystem.addItem('iron_sword', 1);
    
    console.log('✅ Item database initialized with sample items');
  }
  
  private handleDialogueAction(action: string, _context: any): void {
    switch (action) {
      case 'give_hint':
        console.log('🎆 Player received a hint!');
        this.audioManager.playSFX('powerup', { volume: 0.5 });
        break;
      case 'heal_player':
        console.log('❤️ Player healed!');
        this.audioManager.playSFX('coin', { volume: 0.4 });
        break;
      case 'give_item':
        console.log('🎁 Player received an item!');
        this.inventorySystem.addItem('health_potion', 2); // Give 2 health potions as example
        this.audioManager.playSFX('jump', { volume: 0.3 });
        break;
      default:
        console.log('🎬 Unknown action:', action);
    }
  }

  private createTestEntities(): void {
    // Create a player-controlled hero with all systems
    const heroEntity = this.world.createEntity();
    this.playerEntity = heroEntity.id;
    
    // Transform component - start at grid position 10,10
    const startGridPos = { x: 10, y: 10 };
    const worldPos = new Vec2(startGridPos.x * 32, startGridPos.y * 32);
    this.world.addComponent(heroEntity.id, new Transform(
      worldPos,
      0,
      new Vec2(2, 2)
    ));
    
    // Sprite component using Kenney assets
    const heroTexture = this.kenneyAssetManager.getTexture('man_idle');
    if (heroTexture) {
      this.world.addComponent(heroEntity.id, new Sprite(
        'man_idle',
        new Rect(0, 0, 16, 16),
        new Vec2(0.5, 1.0), // Bottom-center anchor for characters
        true, 1, false, false, '#ffffff', 1.0
      ));
    } else {
      // Fallback colored rectangle
      this.world.addComponent(heroEntity.id, new Sprite(
        'hero-fallback',
        new Rect(0, 0, 16, 16),
        new Vec2(0.5, 1.0),
        true, 1, false, false, '#4499ff', 1.0
      ));
    }
    
    // Grid movement component
    this.world.addComponent(heroEntity.id, new GridMovement(startGridPos, {
      gridSize: 32,
      moveSpeed: 0.2, // Faster movement for responsive feel
      easeType: 'easeOut',
      allowDiagonal: false,
      snapToGrid: true
    }));
    
    // Animation component using Kenney assets
    const animator = new Animator();
    // Create animation clips with Kenney assets
    animator.controller.createClip('idle', ['man_idle'], 1.0, { loop: true });
    
    // Check if walking animation frames are available
    const walkTexture1 = this.kenneyAssetManager.getTexture('man_walk1');
    const walkTexture2 = this.kenneyAssetManager.getTexture('man_walk2');
    if (walkTexture1 && walkTexture2) {
      animator.controller.createClip('walk', ['man_walk1', 'man_walk2'], 0.4, { loop: true });
    } else {
      // Fallback to idle animation for walk
      animator.controller.createClip('walk', ['man_idle'], 0.5, { loop: true });
    }
    
    animator.controller.play('idle');
    this.world.addComponent(heroEntity.id, animator);
    
    // Player input component
    this.world.addComponent(heroEntity.id, new PlayerInput());
    
    // Collision component
    const playerCollider = new Collider(
      new Rect(-8, -8, 16, 16), // Center the collider around the sprite
      false, // Not a trigger
      CollisionLayers.PLAYER, // Player layer
      CollisionLayers.createMask(CollisionLayers.ENVIRONMENT, CollisionLayers.NPC, CollisionLayers.ENEMY) // Can collide with these layers
    );
    playerCollider.setCallbacks(
      (event) => {
        console.log('Player collision enter:', event);
        this.audioManager.playSFX('hit', { volume: 0.2 });
      },
      undefined,
      (event) => {
        console.log('Player collision exit:', event);
      }
    );
    this.world.addComponent(heroEntity.id, playerCollider);
    
    // Create some environmental tiles
    this.createEnvironment();
    
    // Create an animated NPC
    this.createAnimatedNPC();
    
    console.log('🎮 Created interactive game entities');
  }
  
  private createEnvironment(): void {
    // Create a grid of tiles
    for (let x = 5; x < 20; x++) {
      for (let y = 5; y < 15; y++) {
        const tileEntity = this.world.createEntity();
        
        this.world.addComponent(tileEntity.id, new Transform(
          new Vec2(x * 32, y * 32),
          0,
          new Vec2(1, 1)
        ));
        
        // Use different Kenney element sprites for variety
        const elementIndex = ((x + y) % 8) + 1;
        const elementTexture = this.kenneyAssetManager.getTexture(`element_${elementIndex}`);
        
        if (elementTexture) {
          this.world.addComponent(tileEntity.id, new Sprite(
            `element_${elementIndex}`,
            new Rect(0, 0, 16, 16), // Kenney elements are 16x16
            new Vec2(0.5, 0.5),
            true, 0, // Background layer
            false, false,
            '#ffffff', // No tint, show original colors
            0.9
          ));
        } else {
          // Fallback to colored rectangles
          const isEven = (x + y) % 2 === 0;
          this.world.addComponent(tileEntity.id, new Sprite(
            'fallback-tile',
            new Rect(0, 0, 32, 32),
            new Vec2(0.5, 0.5),
            true, 0,
            false, false,
            isEven ? '#88ff88' : '#66cc66',
            0.8
          ));
        }
        
        // Add collision to some tiles (create walls on the border)
        const isWall = x === 5 || x === 19 || y === 5 || y === 14;
        if (isWall) {
          const wallCollider = new Collider(
            new Rect(0, 0, 32, 32),
            false, // Solid wall
            CollisionLayers.ENVIRONMENT,
            0 // Walls don't collide with anything (they are static)
          );
          wallCollider.isStatic = true;
          this.world.addComponent(tileEntity.id, wallCollider);
        }
      }
    }
  }
  
  private createAnimatedNPC(): void {
    const npcEntity = this.world.createEntity();
    
    this.world.addComponent(npcEntity.id, new Transform(
      new Vec2(15 * 32, 8 * 32),
      0,
      new Vec2(1.5, 1.5)
    ));
    
    // Use a Kenney alien sprite for the NPC
    const npcTexture = this.kenneyAssetManager.getTexture('alienGreen_round');
    if (npcTexture) {
      this.world.addComponent(npcEntity.id, new Sprite(
        'alienGreen_round',
        new Rect(0, 0, 16, 16),
        new Vec2(0.5, 1.0),
        true, 1, false, false, '#ffffff', 1.0
      ));
    } else {
      // Fallback NPC sprite
      this.world.addComponent(npcEntity.id, new Sprite(
        'npc-fallback',
        new Rect(0, 0, 16, 16),
        new Vec2(0.5, 1.0),
        true, 1, false, false, '#ffaa00', 1.0
      ));
    }
    
    // Add spinning animation
    (window as any).__rotatingEntity = npcEntity.id;
    
    // Add grid movement for patrol behavior
    this.world.addComponent(npcEntity.id, new GridMovement({ x: 15, y: 8 }, {
      gridSize: 32,
      moveSpeed: 0.5,
      easeType: 'linear',
      allowDiagonal: false,
      snapToGrid: true
    }));
    
    // Add collision component for NPC
    const npcCollider = new Collider(
      new Rect(-8, -8, 16, 16),
      false, // Not a trigger
      CollisionLayers.NPC,
      CollisionLayers.createMask(CollisionLayers.PLAYER, CollisionLayers.ENVIRONMENT)
    );
    npcCollider.setCallbacks(
      (event) => {
        console.log('NPC collision with:', event);
        this.audioManager.playSFX('beep', { volume: 0.4 });
      }
    );
    this.world.addComponent(npcEntity.id, npcCollider);
    
    // Add dialogue component
    const npcDialogue = new DialogueComponent(
      'alien_encounter',
      48, // Trigger distance
      false, // Don't auto-trigger
      true, // Requires interaction
      'KeyE', // E key to interact
      true // Can repeat dialogue
    );
    this.world.addComponent(npcEntity.id, npcDialogue);
    
    // Start NPC patrol
    this.startNPCPatrol(npcEntity.id);
  }
  
  private startNPCPatrol(entityId: number): void {
    const patrolPath = ['right', 'right', 'down', 'down', 'left', 'left', 'up', 'up'];
    let currentStep = 0;
    
    const moveNext = () => {
      const gridMovement = this.world.getComponent(entityId, GridMovement);
      if (gridMovement && !gridMovement.controller.isMoving()) {
        const direction = patrolPath[currentStep] as any;
        gridMovement.controller.move(direction, () => {
          currentStep = (currentStep + 1) % patrolPath.length;
          // Schedule next move
          setTimeout(moveNext, 1000 + Math.random() * 1000);
        });
      }
    };
    
    // Start patrol after a delay
    setTimeout(moveNext, 2000);
  }
  
  private setupInputHandling(): void {
    // Keyboard event listeners
    document.addEventListener('keydown', (event) => {
      this.keysPressed.add(event.code);
      
      // Handle immediate audio feedback
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        // Play a subtle beep for movement input
        this.audioManager.playSFX('beep', { volume: 0.3 });
      }
      
      if (event.code === 'Space') {
        this.audioManager.playSFX('jump');
      }
      
      if (event.code === 'KeyM') {
        // Toggle mute
        this.audioManager.toggleMute();
      }
      
      if (event.code === 'KeyC') {
        // Play coin sound
        this.audioManager.playSFX('coin');
      }
      
      if (event.code === 'KeyI') {
        // Toggle inventory
        this.inventorySystem.toggleVisibility();
        this.audioManager.playSFX('beep', { volume: 0.4 });
      }
      
      if (event.code === 'KeyT') {
        // Test: Add a random item to inventory
        const testItems = ['health_potion', 'mana_potion', 'iron_sword', 'steel_shield', 'ancient_key'];
        const randomItem = testItems[Math.floor(Math.random() * testItems.length)];
        this.inventorySystem.addItem(randomItem, Math.floor(Math.random() * 3) + 1);
        console.log('🧪 Test: Added', randomItem, 'to inventory');
      }
    });
    
    document.addEventListener('keyup', (event) => {
      this.keysPressed.delete(event.code);
    });
    
    // Prevent default behavior for arrow keys and space
    document.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    });
  }

  private update = (dt: number): void => {
    // Update global systems
    globalScheduler.update(dt);
    globalTweens.update(dt);
    
    // Update player input and movement
    this.updatePlayerMovement(dt);
    
    // Update all animations
    this.updateAnimations(dt);
    
    // Update collision detection
    this.collisionSystem.update(dt);
    
    // Update dialogue system
    this.dialogueSystem.update(dt);
    
    // Update inventory system
    this.inventorySystem.update(dt);
    
    // Update dialogue interactions
    this.updateDialogueInteractions();
    
    // Update ECS world
    this.world.update(dt);

    // Demo animation: rotate the NPC sprite
    const rotatingEntityId = (window as any).__rotatingEntity;
    if (rotatingEntityId) {
      const transform = this.world.getComponent(rotatingEntityId, Transform);
      if (transform) {
        transform.rotation += dt * 1; // 1 radian per second
      }
    }

    // Update debug info
    this.updateDebugInfo();
  };
  
  private updatePlayerMovement(dt: number): void {
    if (!this.playerEntity) return;
    
    const playerInput = this.world.getComponent(this.playerEntity, PlayerInput);
    const gridMovement = this.world.getComponent(this.playerEntity, GridMovement);
    const animator = this.world.getComponent(this.playerEntity, Animator);
    
    if (!playerInput || !gridMovement || !animator) return;
    
    // Handle input cooldown
    if (playerInput.inputCooldown > 0) {
      playerInput.inputCooldown -= dt;
    }
    
    // Check for movement input
    if (!gridMovement.controller.isMoving() && playerInput.inputCooldown <= 0) {
      let direction: any = null;
      
      // Check keyboard input
      if (this.keysPressed.has('ArrowUp') || this.keysPressed.has('KeyW')) {
        direction = 'up';
      } else if (this.keysPressed.has('ArrowDown') || this.keysPressed.has('KeyS')) {
        direction = 'down';
      } else if (this.keysPressed.has('ArrowLeft') || this.keysPressed.has('KeyA')) {
        direction = 'left';
      } else if (this.keysPressed.has('ArrowRight') || this.keysPressed.has('KeyD')) {
        direction = 'right';
      }
      
      if (direction) {
        const success = gridMovement.controller.move(direction, () => {
          // Movement completed
          animator.controller.play('idle');
        });
        
        if (success) {
          // Start walking animation
          animator.controller.play('walk');
          
          // Set input cooldown to prevent rapid movement
          playerInput.inputCooldown = 0.05;
          
          // Update sprite facing direction
          const sprite = this.world.getComponent(this.playerEntity, Sprite);
          if (sprite && (direction === 'left' || direction === 'right')) {
            sprite.flipX = direction === 'left';
          }
        }
      } else if (animator.controller.getCurrentFrameId().includes('walk')) {
        // No input, stop walking animation
        animator.controller.play('idle');
      }
    }
    
    // Update transform position from grid movement
    const transform = this.world.getComponent(this.playerEntity, Transform);
    if (transform) {
      const worldPos = gridMovement.controller.getWorldPosition();
      transform.position.copy(worldPos);
    }
  }
  
  private updateAnimations(dt: number): void {
    // Update all animation controllers
    const query = this.world.createQuery().with(Animator);
    
    query.forEach((entityId, animator) => {
      const animatorComp = animator as Animator;
      animatorComp.controller.update(dt);
      
      // Update sprite texture based on current animation frame
      const sprite = this.world.getComponent(entityId, Sprite);
      if (sprite) {
        const currentFrame = animatorComp.controller.getCurrentFrameId();
        if (currentFrame && currentFrame !== sprite.textureId) {
          sprite.textureId = currentFrame;
        }
      }
    });
  };

  private render = (_interpolation: number): void => {
    // Clear canvas with retro background
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render background pattern
    this.renderBackground();

    // Render all sprites using the advanced SpriteRenderer
    const query = this.world.createQuery()
      .with(Transform)
      .with(Sprite);

    // Collect and sort sprites by layer
    const spriteData: Array<{ transform: Transform; sprite: Sprite }> = [];
    query.forEach((_entityId, transform, sprite) => {
      spriteData.push({ 
        transform: transform as Transform, 
        sprite: sprite as Sprite 
      });
    });

    // Sort by layer for proper rendering order
    spriteData.sort((a, b) => a.sprite.layer - b.sprite.layer);

    // Render sprites with the advanced renderer
    spriteData.forEach(({ transform, sprite }) => {
      this.spriteRenderer.renderSprite(transform, sprite);
    });

    // Apply SNES-style effects
    this.applySNESEffects();

    // Render UI and debug info
    this.renderUI();
    
    // Render inventory system (UI layer)
    this.inventorySystem.render();
    
    // Render dialogue system (always render last, on top)
    this.dialogueSystem.render();
  };
  
  private updateDialogueInteractions(): void {
    if (!this.playerEntity || this.dialogueSystem.isActive()) return;
    
    const playerTransform = this.world.getComponent(this.playerEntity, Transform);
    if (!playerTransform) return;
    
    // Find nearby NPCs with dialogue components
    const dialogueQuery = this.world.createQuery().with(DialogueComponent).with(Transform);
    
    dialogueQuery.forEach((entityId, dialogueComponent, transform) => {
      const dialogue = dialogueComponent as DialogueComponent;
      const npcTransform = transform as Transform;
      
      // Calculate distance to player
      const distance = playerTransform.position.distance(npcTransform.position);
      
      if (distance <= dialogue.triggerDistance && dialogue.canTrigger()) {
        if (dialogue.autoTrigger) {
          // Auto-trigger dialogue
          this.startNPCDialogue(entityId, dialogue);
        } else if (dialogue.requiresInteraction && this.keysPressed.has(dialogue.interactionKey)) {
          // Manual trigger with interaction key
          this.startNPCDialogue(entityId, dialogue);
          this.keysPressed.delete(dialogue.interactionKey); // Prevent repeat triggers
        }
      }
    });
  }
  
  private startNPCDialogue(entityId: number, dialogueComponent: DialogueComponent): void {
    console.log('👥 Starting dialogue with NPC:', entityId);
    
    if (this.dialogueSystem.startDialogue(dialogueComponent.dialogueTreeId)) {
      dialogueComponent.trigger();
      
      // Set up dialogue end callback to reset component state
      const originalEndCallback = this.dialogueSystem['callbacks'].onDialogueEnd;
      this.dialogueSystem['callbacks'].onDialogueEnd = (treeId) => {
        dialogueComponent.endDialogue();
        originalEndCallback?.(treeId);
      };
    }
  }

  private renderBackground(): void {
    // Create a subtle grid pattern
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    const gridSize = 32;
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  private applySNESEffects(): void {
    // Apply subtle scanline effect for SNES authenticity
    this.spriteRenderer.applyScanlineEffect(0.03);
    
    // Apply subtle CRT effect
    this.spriteRenderer.applyCRTEffect(0.015);
  }

  private renderUI(): void {
    // Title
    this.spriteRenderer.renderPixelText(
      'SNES JRPG Framework - Complete Demo',
      new Vec2(20, 20),
      {
        font: 'monospace',
        size: 16,
        color: '#ffffff',
        outline: { color: '#000000', width: 2 }
      }
    );
    
    // Features
    const features = [
      'Grid Movement + Smooth Animation',
      'Pixel Perfect Kenney Sprites',
      'Dialogue System + NPC Interactions',
      'Inventory System + Items Database',
      'SNES Audio Effects + Music',
      'Advanced ECS Architecture'
    ];
    
    features.forEach((feature, index) => {
      this.spriteRenderer.renderPixelText(
        `• ${feature}`,
        new Vec2(20, 45 + index * 15),
        {
          font: 'monospace',
          size: 10,
          color: '#ffaa00',
          outline: { color: '#000000', width: 1 }
        }
      );
    });
    
    // Controls
    const controls = [
      'WASD/Arrows: Move Player',
      'E: Interact with NPCs',
      'I: Toggle Inventory | T: Add Random Item',
      'Space: Jump Sound | Enter: Continue Dialogue',
      'C: Coin Sound | M: Toggle Mute'
    ];
    
    this.spriteRenderer.renderPixelText(
      'Controls:',
      new Vec2(20, 140),
      {
        font: 'monospace',
        size: 12,
        color: '#00ff88',
        outline: { color: '#000000', width: 1 }
      }
    );
    
    controls.forEach((control, index) => {
      this.spriteRenderer.renderPixelText(
        control,
        new Vec2(20, 160 + index * 12),
        {
          font: 'monospace',
          size: 9,
          color: '#ffffff',
          outline: { color: '#000000', width: 1 }
        }
      );
    });
    
    // Game state info
    if (this.playerEntity) {
      const gridMovement = this.world.getComponent(this.playerEntity, GridMovement);
      if (gridMovement) {
        const gridPos = gridMovement.controller.getGridPosition();
        this.spriteRenderer.renderPixelText(
          `Player: (${gridPos.x}, ${gridPos.y})`,
          new Vec2(20, 230),
          {
            font: 'monospace',
            size: 10,
            color: '#88ff88',
            outline: { color: '#000000', width: 1 }
          }
        );
        
        if (gridMovement.controller.isMoving()) {
          this.spriteRenderer.renderPixelText(
            'Moving...',
            new Vec2(20, 245),
            {
              font: 'monospace',
              size: 9,
              color: '#ffff00',
              outline: { color: '#000000', width: 1 }
            }
          );
        }
      }
    }
    
    // Audio state
    const audioSettings = this.audioManager.getSettings();
    this.spriteRenderer.renderPixelText(
      `Audio: ${audioSettings.muted ? 'MUTED' : 'ON'}`,
      new Vec2(20, 270),
      {
        font: 'monospace',
        size: 9,
        color: audioSettings.muted ? '#ff4444' : '#44ff44',
        outline: { color: '#000000', width: 1 }
      }
    );
    
    // Show interaction prompt if near NPC
    this.renderInteractionPrompt();
  };
  
  private renderInteractionPrompt(): void {
    if (!this.playerEntity || this.dialogueSystem.isActive()) return;
    
    const playerTransform = this.world.getComponent(this.playerEntity, Transform);
    if (!playerTransform) return;
    
    // Check if near any NPCs
    const dialogueQuery = this.world.createQuery().with(DialogueComponent).with(Transform);
    let nearNPC = false;
    
    dialogueQuery.forEach((_entityId, dialogueComponent, transform) => {
      const dialogue = dialogueComponent as DialogueComponent;
      const npcTransform = transform as Transform;
      
      const distance = playerTransform.position.distance(npcTransform.position);
      
      if (distance <= dialogue.triggerDistance && dialogue.canTrigger() && !dialogue.autoTrigger) {
        nearNPC = true;
      }
    });
    
    if (nearNPC) {
      // Show interaction prompt
      const promptText = 'Press E to talk';
      const textWidth = this.ctx.measureText(promptText).width;
      const x = this.canvas.width / 2 - textWidth / 2;
      const y = 350;
      
      // Background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(x - 10, y - 20, textWidth + 20, 30);
      
      // Border
      this.ctx.strokeStyle = '#ffff00';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x - 10, y - 20, textWidth + 20, 30);
      
      // Text with pulsing effect
      const time = Date.now() / 300;
      const alpha = (Math.sin(time) + 1) / 2 * 0.5 + 0.5;
      
      this.spriteRenderer.renderPixelText(
        promptText,
        new Vec2(x, y),
        {
          font: 'monospace',
          size: 12,
          color: `rgba(255, 255, 0, ${alpha})`,
          outline: { color: '#000000', width: 2 }
        }
      );
    }
  }

  private updateDebugInfo(): void {
    const debugElement = document.getElementById('debug-info');
    if (debugElement) {
      debugElement.innerHTML = `
        <div>FPS: ${this.gameLoop.getFPS()}</div>
        <div>Entities: ${this.world.getEntityCount()}</div>
        <div>Scheduled Tasks: ${globalScheduler.getEventCount()}</div>
        <div>Active Tweens: ${globalTweens.getTweenCount()}</div>
      `;
    }
  }

  public start(): void {
    console.log('🚀 Starting game loop...');
    this.gameLoop.start();
  }

  public stop(): void {
    console.log('⏹️ Stopping game...');
    this.gameLoop.stop();
  }
}

// Initialize and start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    game.start();
    
    // Global access for debugging
    (window as any).__game = game;
    
    console.log('🎯 Game started! Check the canvas and debug info.');
    console.log('💡 Access via window.__game for debugging');
  } catch (error) {
    console.error('❌ Failed to start game:', error);
  }
});