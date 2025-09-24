import { Vec2 } from '../math/Vec2';

/**
 * Types of dialogue nodes for branching conversations
 */
export enum DialogueNodeType {
  TEXT = 'text',         // Simple text display
  CHOICE = 'choice',     // Player choice selection
  CONDITION = 'condition', // Conditional branching
  ACTION = 'action',     // Execute game action
  END = 'end'           // End conversation
}

/**
 * Dialogue choice option
 */
export interface DialogueChoice {
  text: string;
  nextNodeId?: string;
  condition?: string; // Optional condition to show this choice
  action?: string;    // Optional action to execute when chosen
}

/**
 * Individual dialogue node
 */
export interface DialogueNode {
  id: string;
  type: DialogueNodeType;
  text?: string;
  speaker?: string;
  portrait?: string;
  choices?: DialogueChoice[];
  nextNodeId?: string;  // For linear progression
  condition?: string;   // For conditional nodes
  action?: string;      // For action nodes
  variables?: Record<string, any>; // Node-specific variables
}

/**
 * Complete dialogue tree/conversation
 */
export interface DialogueTree {
  id: string;
  name: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
  variables: Record<string, any>; // Persistent conversation variables
}

/**
 * Dialogue display configuration
 */
export interface DialogueConfig {
  boxWidth: number;
  boxHeight: number;
  boxPosition: Vec2;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  fontSize: number;
  fontFamily: string;
  textPadding: number;
  typewriterSpeed: number; // Characters per second
  portraitSize: Vec2;
  portraitPosition: Vec2;
  showSpeakerName: boolean;
  speakerNameColor: string;
}

/**
 * Current dialogue state
 */
export interface DialogueState {
  isActive: boolean;
  currentTree?: DialogueTree;
  currentNode?: DialogueNode;
  displayedText: string;
  fullText: string;
  textIndex: number;
  waitingForInput: boolean;
  showingChoices: boolean;
  selectedChoiceIndex: number;
  typewriterTimer: number;
  speaker?: string;
  portrait?: string;
}

/**
 * Dialogue event callbacks
 */
export interface DialogueCallbacks {
  onDialogueStart?: (treeId: string) => void;
  onDialogueEnd?: (treeId: string) => void;
  onNodeEnter?: (nodeId: string, node: DialogueNode) => void;
  onNodeExit?: (nodeId: string, node: DialogueNode) => void;
  onChoiceSelected?: (choiceIndex: number, choice: DialogueChoice) => void;
  onActionExecute?: (action: string, context: any) => void;
}

/**
 * Main dialogue system class
 */
export class DialogueSystem {
  private config: DialogueConfig;
  private state: DialogueState;
  private callbacks: DialogueCallbacks;
  private trees: Map<string, DialogueTree> = new Map();
  private ctx: CanvasRenderingContext2D;
  
  // Input handling
  private keysPressed: Set<string> = new Set();
  
  constructor(
    canvas: HTMLCanvasElement,
    config?: Partial<DialogueConfig>,
    callbacks?: DialogueCallbacks
  ) {
    this.ctx = canvas.getContext('2d')!;
    
    // Default configuration
    this.config = {
      boxWidth: 600,
      boxHeight: 150,
      boxPosition: new Vec2(100, 450),
      textColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 50, 0.9)',
      borderColor: '#ffffff',
      fontSize: 16,
      fontFamily: 'monospace',
      textPadding: 20,
      typewriterSpeed: 50, // Characters per second
      portraitSize: new Vec2(80, 80),
      portraitPosition: new Vec2(20, 420),
      showSpeakerName: true,
      speakerNameColor: '#ffff00',
      ...config
    };
    
    this.callbacks = callbacks || {};
    
    // Initialize dialogue state
    this.state = {
      isActive: false,
      displayedText: '',
      fullText: '',
      textIndex: 0,
      waitingForInput: false,
      showingChoices: false,
      selectedChoiceIndex: 0,
      typewriterTimer: 0
    };
    
    this.setupInputHandling();
  }

  /**
   * Register a dialogue tree
   */
  registerDialogueTree(tree: DialogueTree): void {
    this.trees.set(tree.id, tree);
    console.log(`📜 Registered dialogue tree: ${tree.name} (${tree.id})`);
  }

  /**
   * Start a dialogue conversation
   */
  startDialogue(treeId: string): boolean {
    const tree = this.trees.get(treeId);
    if (!tree) {
      console.error(`Dialogue tree not found: ${treeId}`);
      return false;
    }

    const startNode = tree.nodes[tree.startNodeId];
    if (!startNode) {
      console.error(`Start node not found for tree: ${treeId}`);
      return false;
    }

    this.state.isActive = true;
    this.state.currentTree = tree;
    this.state.currentNode = startNode;
    this.state.waitingForInput = false;
    this.state.showingChoices = false;
    this.state.selectedChoiceIndex = 0;

    this.callbacks.onDialogueStart?.(treeId);
    this.processCurrentNode();

    return true;
  }

  /**
   * End the current dialogue
   */
  endDialogue(): void {
    if (!this.state.isActive) return;

    const treeId = this.state.currentTree?.id;
    this.callbacks.onDialogueEnd?.(treeId || '');

    this.state.isActive = false;
    this.state.currentTree = undefined;
    this.state.currentNode = undefined;
    this.state.displayedText = '';
    this.state.fullText = '';
    this.state.waitingForInput = false;
    this.state.showingChoices = false;
  }

  /**
   * Update the dialogue system
   */
  update(deltaTime: number): void {
    if (!this.state.isActive) return;

    // Update typewriter effect
    if (!this.state.waitingForInput && !this.state.showingChoices) {
      this.updateTypewriter(deltaTime);
    }
  }

  /**
   * Render the dialogue box
   */
  render(): void {
    if (!this.state.isActive) return;

    this.renderDialogueBox();
    this.renderText();
    
    if (this.state.showingChoices) {
      this.renderChoices();
    }
    
    if (this.state.portrait) {
      this.renderPortrait();
    }
    
    if (this.state.waitingForInput && !this.state.showingChoices) {
      this.renderContinueIndicator();
    }
  }

  /**
   * Check if dialogue system is currently active
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Get dialogue variable
   */
  getVariable(name: string): any {
    return this.state.currentTree?.variables[name];
  }

  /**
   * Set dialogue variable
   */
  setVariable(name: string, value: any): void {
    if (this.state.currentTree) {
      this.state.currentTree.variables[name] = value;
    }
  }

  /**
   * Process the current dialogue node
   */
  private processCurrentNode(): void {
    const node = this.state.currentNode;
    if (!node) return;

    this.callbacks.onNodeEnter?.(node.id, node);

    switch (node.type) {
      case DialogueNodeType.TEXT:
        this.processTextNode(node);
        break;
      case DialogueNodeType.CHOICE:
        this.processChoiceNode(node);
        break;
      case DialogueNodeType.CONDITION:
        this.processConditionNode(node);
        break;
      case DialogueNodeType.ACTION:
        this.processActionNode(node);
        break;
      case DialogueNodeType.END:
        this.endDialogue();
        break;
    }
  }

  /**
   * Process a text node
   */
  private processTextNode(node: DialogueNode): void {
    this.state.fullText = node.text || '';
    this.state.displayedText = '';
    this.state.textIndex = 0;
    this.state.typewriterTimer = 0;
    this.state.waitingForInput = false;
    this.state.showingChoices = false;
    this.state.speaker = node.speaker;
    this.state.portrait = node.portrait;
  }

  /**
   * Process a choice node
   */
  private processChoiceNode(node: DialogueNode): void {
    this.state.fullText = node.text || '';
    this.state.displayedText = this.state.fullText;
    this.state.waitingForInput = false;
    this.state.showingChoices = true;
    this.state.selectedChoiceIndex = 0;
    this.state.speaker = node.speaker;
    this.state.portrait = node.portrait;
  }

  /**
   * Process a condition node
   */
  private processConditionNode(node: DialogueNode): void {
    // Simple condition evaluation - in a real system you'd want a proper expression evaluator
    const conditionMet = this.evaluateCondition(node.condition || '');
    
    if (conditionMet && node.nextNodeId) {
      this.goToNode(node.nextNodeId);
    } else {
      // Could have alternate path or end dialogue
      this.endDialogue();
    }
  }

  /**
   * Process an action node
   */
  private processActionNode(node: DialogueNode): void {
    if (node.action) {
      this.callbacks.onActionExecute?.(node.action, {
        tree: this.state.currentTree,
        node: node,
        variables: this.state.currentTree?.variables
      });
    }

    if (node.nextNodeId) {
      this.goToNode(node.nextNodeId);
    } else {
      this.endDialogue();
    }
  }

  /**
   * Navigate to a specific node
   */
  private goToNode(nodeId: string): void {
    if (!this.state.currentTree) return;

    const node = this.state.currentTree.nodes[nodeId];
    if (!node) {
      console.error(`Node not found: ${nodeId}`);
      this.endDialogue();
      return;
    }

    this.callbacks.onNodeExit?.(this.state.currentNode?.id || '', this.state.currentNode!);
    this.state.currentNode = node;
    this.processCurrentNode();
  }

  /**
   * Update typewriter text effect
   */
  private updateTypewriter(deltaTime: number): void {
    if (this.state.textIndex >= this.state.fullText.length) {
      this.state.waitingForInput = true;
      return;
    }

    this.state.typewriterTimer += deltaTime;
    const charsToShow = Math.floor(this.state.typewriterTimer * this.config.typewriterSpeed);
    
    if (charsToShow > this.state.textIndex) {
      this.state.textIndex = Math.min(charsToShow, this.state.fullText.length);
      this.state.displayedText = this.state.fullText.substring(0, this.state.textIndex);
    }
  }

  /**
   * Handle input for dialogue progression
   */
  private handleInput(): void {
    if (!this.state.isActive) return;

    if (this.state.showingChoices) {
      this.handleChoiceInput();
    } else if (this.state.waitingForInput) {
      this.handleTextInput();
    } else if (this.keysPressed.has('Space') || this.keysPressed.has('Enter')) {
      // Skip typewriter effect
      this.state.textIndex = this.state.fullText.length;
      this.state.displayedText = this.state.fullText;
      this.state.waitingForInput = true;
    }
  }

  /**
   * Handle input when showing choices
   */
  private handleChoiceInput(): void {
    const choices = this.state.currentNode?.choices || [];
    
    if (this.keysPressed.has('ArrowUp')) {
      this.state.selectedChoiceIndex = Math.max(0, this.state.selectedChoiceIndex - 1);
      this.keysPressed.delete('ArrowUp');
    } else if (this.keysPressed.has('ArrowDown')) {
      this.state.selectedChoiceIndex = Math.min(choices.length - 1, this.state.selectedChoiceIndex + 1);
      this.keysPressed.delete('ArrowDown');
    } else if (this.keysPressed.has('Enter') || this.keysPressed.has('Space')) {
      const selectedChoice = choices[this.state.selectedChoiceIndex];
      if (selectedChoice) {
        this.selectChoice(selectedChoice);
      }
      this.keysPressed.delete('Enter');
      this.keysPressed.delete('Space');
    }
  }

  /**
   * Handle input when waiting for text continuation
   */
  private handleTextInput(): void {
    if (this.keysPressed.has('Enter') || this.keysPressed.has('Space')) {
      if (this.state.currentNode?.nextNodeId) {
        this.goToNode(this.state.currentNode.nextNodeId);
      } else {
        this.endDialogue();
      }
      this.keysPressed.delete('Enter');
      this.keysPressed.delete('Space');
    }
  }

  /**
   * Select a dialogue choice
   */
  private selectChoice(choice: DialogueChoice): void {
    this.callbacks.onChoiceSelected?.(this.state.selectedChoiceIndex, choice);

    if (choice.action) {
      this.callbacks.onActionExecute?.(choice.action, {
        tree: this.state.currentTree,
        choice: choice,
        variables: this.state.currentTree?.variables
      });
    }

    if (choice.nextNodeId) {
      this.goToNode(choice.nextNodeId);
    } else {
      this.endDialogue();
    }
  }

  /**
   * Simple condition evaluation
   */
  private evaluateCondition(condition: string): boolean {
    if (!condition || !this.state.currentTree) return true;

    // Simple variable checks - extend as needed
    // Format: "variableName==value" or "variableName>value" etc.
    const variables = this.state.currentTree.variables;
    
    if (condition.includes('==')) {
      const [varName, value] = condition.split('==');
      return variables[varName.trim()] == value.trim();
    } else if (condition.includes('>')) {
      const [varName, value] = condition.split('>');
      return Number(variables[varName.trim()]) > Number(value.trim());
    } else if (condition.includes('<')) {
      const [varName, value] = condition.split('<');
      return Number(variables[varName.trim()]) < Number(value.trim());
    }

    // Default to checking if variable exists and is truthy
    return !!variables[condition.trim()];
  }

  /**
   * Render the dialogue box background
   */
  private renderDialogueBox(): void {
    const { boxWidth, boxHeight, boxPosition, backgroundColor, borderColor } = this.config;

    // Draw background
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(boxPosition.x, boxPosition.y, boxWidth, boxHeight);

    // Draw border
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boxPosition.x, boxPosition.y, boxWidth, boxHeight);
  }

  /**
   * Render dialogue text
   */
  private renderText(): void {
    const { boxPosition, textPadding, fontSize, fontFamily, textColor, speakerNameColor } = this.config;

    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = textColor;

    let yOffset = boxPosition.y + textPadding + fontSize;

    // Render speaker name
    if (this.config.showSpeakerName && this.state.speaker) {
      this.ctx.fillStyle = speakerNameColor;
      this.ctx.fillText(this.state.speaker + ':', boxPosition.x + textPadding, yOffset);
      yOffset += fontSize + 5;
      this.ctx.fillStyle = textColor;
    }

    // Render text with word wrapping
    const maxWidth = this.config.boxWidth - textPadding * 2;
    const words = this.state.displayedText.split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && line !== '') {
        this.ctx.fillText(line, boxPosition.x + textPadding, yOffset);
        line = word + ' ';
        yOffset += fontSize + 2;
      } else {
        line = testLine;
      }
    }

    if (line) {
      this.ctx.fillText(line, boxPosition.x + textPadding, yOffset);
    }
  }

  /**
   * Render dialogue choices
   */
  private renderChoices(): void {
    const choices = this.state.currentNode?.choices || [];
    const { boxPosition, boxWidth, textPadding, fontSize, fontFamily, textColor } = this.config;

    this.ctx.font = `${fontSize}px ${fontFamily}`;

    let yOffset = boxPosition.y + this.config.boxHeight - textPadding - (choices.length * (fontSize + 5));

    choices.forEach((choice, index) => {
      const isSelected = index === this.state.selectedChoiceIndex;
      
      // Highlight selected choice
      if (isSelected) {
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.fillRect(
          boxPosition.x + textPadding - 5,
          yOffset - fontSize,
          boxWidth - textPadding * 2 + 10,
          fontSize + 5
        );
      }

      this.ctx.fillStyle = isSelected ? '#ffff00' : textColor;
      this.ctx.fillText(
        `► ${choice.text}`,
        boxPosition.x + textPadding,
        yOffset
      );

      yOffset += fontSize + 5;
    });
  }

  /**
   * Render character portrait
   */
  private renderPortrait(): void {
    // Placeholder for portrait rendering
    // In a real implementation, you'd load and draw portrait images
    const { portraitPosition, portraitSize } = this.config;

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(portraitPosition.x, portraitPosition.y, portraitSize.x, portraitSize.y);

    this.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    this.ctx.fillRect(portraitPosition.x, portraitPosition.y, portraitSize.x, portraitSize.y);

    // Render portrait placeholder text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('Portrait', portraitPosition.x + 10, portraitPosition.y + portraitSize.y / 2);
  }

  /**
   * Render continuation indicator
   */
  private renderContinueIndicator(): void {
    const { boxPosition, boxWidth, boxHeight } = this.config;

    // Animated arrow or indicator
    const time = Date.now() / 500;
    const alpha = (Math.sin(time) + 1) / 2;

    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    this.ctx.font = '12px monospace';
    this.ctx.fillText('▼', boxPosition.x + boxWidth - 30, boxPosition.y + boxHeight - 15);
  }

  /**
   * Setup input event handlers
   */
  private setupInputHandling(): void {
    document.addEventListener('keydown', (event) => {
      if (this.state.isActive) {
        this.keysPressed.add(event.code);
        this.handleInput();
        event.preventDefault();
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keysPressed.delete(event.code);
    });
  }
}