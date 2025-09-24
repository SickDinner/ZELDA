import { DialogueTree, DialogueChoice, DialogueNodeType } from './DialogueSystem';

/**
 * Builder class for creating dialogue trees programmatically
 */
export class DialogueBuilder {
  private tree: DialogueTree;
  private currentNodeId: string = '';

  constructor(id: string, name: string) {
    this.tree = {
      id,
      name,
      startNodeId: '',
      nodes: {},
      variables: {}
    };
  }

  /**
   * Create a text node
   */
  text(nodeId: string, text: string, speaker?: string, portrait?: string): this {
    this.tree.nodes[nodeId] = {
      id: nodeId,
      type: DialogueNodeType.TEXT,
      text,
      speaker,
      portrait
    };

    if (!this.tree.startNodeId) {
      this.tree.startNodeId = nodeId;
    }

    this.currentNodeId = nodeId;
    return this;
  }

  /**
   * Create a choice node
   */
  choice(nodeId: string, text: string, choices: DialogueChoice[], speaker?: string): this {
    this.tree.nodes[nodeId] = {
      id: nodeId,
      type: DialogueNodeType.CHOICE,
      text,
      choices,
      speaker
    };

    if (!this.tree.startNodeId) {
      this.tree.startNodeId = nodeId;
    }

    this.currentNodeId = nodeId;
    return this;
  }

  /**
   * Create a condition node
   */
  condition(nodeId: string, conditionExpression: string, nextNodeId: string): this {
    this.tree.nodes[nodeId] = {
      id: nodeId,
      type: DialogueNodeType.CONDITION,
      condition: conditionExpression,
      nextNodeId
    };

    if (!this.tree.startNodeId) {
      this.tree.startNodeId = nodeId;
    }

    this.currentNodeId = nodeId;
    return this;
  }

  /**
   * Create an action node
   */
  action(nodeId: string, actionName: string, nextNodeId?: string): this {
    this.tree.nodes[nodeId] = {
      id: nodeId,
      type: DialogueNodeType.ACTION,
      action: actionName,
      nextNodeId
    };

    if (!this.tree.startNodeId) {
      this.tree.startNodeId = nodeId;
    }

    this.currentNodeId = nodeId;
    return this;
  }

  /**
   * Create an end node
   */
  end(nodeId: string): this {
    this.tree.nodes[nodeId] = {
      id: nodeId,
      type: DialogueNodeType.END
    };

    if (!this.tree.startNodeId) {
      this.tree.startNodeId = nodeId;
    }

    this.currentNodeId = nodeId;
    return this;
  }

  /**
   * Set the next node for the current node (for linear progression)
   */
  then(nextNodeId: string): this {
    if (this.currentNodeId && this.tree.nodes[this.currentNodeId]) {
      this.tree.nodes[this.currentNodeId].nextNodeId = nextNodeId;
    }
    return this;
  }

  /**
   * Set a variable in the dialogue tree
   */
  setVariable(name: string, value: any): this {
    this.tree.variables[name] = value;
    return this;
  }

  /**
   * Set the starting node
   */
  start(nodeId: string): this {
    this.tree.startNodeId = nodeId;
    return this;
  }

  /**
   * Build and return the completed dialogue tree
   */
  build(): DialogueTree {
    return { ...this.tree };
  }

  /**
   * Create a simple linear conversation
   */
  static createSimpleConversation(
    id: string,
    name: string,
    messages: Array<{
      text: string;
      speaker?: string;
      portrait?: string;
    }>
  ): DialogueTree {
    const builder = new DialogueBuilder(id, name);

    messages.forEach((message, index) => {
      const nodeId = `node_${index}`;
      const isLast = index === messages.length - 1;
      
      builder.text(nodeId, message.text, message.speaker, message.portrait);
      
      if (!isLast) {
        builder.then(`node_${index + 1}`);
      }
    });

    return builder.build();
  }

  /**
   * Create a branching conversation with choices
   */
  static createBranchingConversation(
    id: string,
    name: string,
    config: {
      greeting: { text: string; speaker?: string };
      choices: Array<{
        text: string;
        response: { text: string; speaker?: string };
        action?: string;
      }>;
      farewell?: { text: string; speaker?: string };
    }
  ): DialogueTree {
    const builder = new DialogueBuilder(id, name);

    // Create greeting
    builder.text('greeting', config.greeting.text, config.greeting.speaker);

    // Create choice node
    const choices: DialogueChoice[] = config.choices.map((choice, index) => ({
      text: choice.text,
      nextNodeId: `response_${index}`,
      action: choice.action
    }));

    builder.choice('choices', 'What would you like to know?', choices);
    builder.then('choices'); // Greeting leads to choices

    // Create response nodes
    config.choices.forEach((choice, index) => {
      const responseId = `response_${index}`;
      builder.text(responseId, choice.response.text, choice.response.speaker);
      
      if (config.farewell) {
        builder.then('farewell');
      }
    });

    // Create farewell if specified
    if (config.farewell) {
      builder.text('farewell', config.farewell.text, config.farewell.speaker);
    }

    return builder.build();
  }
}