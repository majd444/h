/**
 * Base Plugin Implementation
 * 
 * This module provides a base implementation of the ChatbotPlugin interface
 * that can be extended by specific platform integrations.
 */
import { 
  ChatbotPlugin, 
  PluginConfigField, 
  ChatMessage, 
  ValidationResult,
  ConnectionStatus
} from './plugin-interface';

export abstract class BasePlugin implements ChatbotPlugin {
  id: string;
  name: string;
  platform: string;
  version: string;
  enabled: boolean = false;
  configSchema: PluginConfigField[];
  config: Record<string, any> = {};

  constructor(
    id: string,
    name: string,
    platform: string,
    version: string,
    configSchema: PluginConfigField[]
  ) {
    this.id = id;
    this.name = name;
    this.platform = platform;
    this.version = version;
    this.configSchema = configSchema;
  }

  async initialize(config: Record<string, any>): Promise<boolean> {
    // Validate configuration before initializing
    const validationResult = await this.validateConfig(config);
    
    if (!validationResult.valid) {
      console.error(`Invalid configuration for plugin ${this.name}:`, validationResult.errors);
      return false;
    }
    
    this.config = { ...config };
    this.enabled = true;
    
    try {
      // Call platform-specific initialization
      await this.onInitialize();
      return true;
    } catch (error) {
      console.error(`Failed to initialize plugin ${this.name}:`, error);
      this.enabled = false;
      return false;
    }
  }

  // Abstract methods to be implemented by specific platform plugins
  protected abstract onInitialize(): Promise<void>;
  
  abstract sendMessage(message: ChatMessage): Promise<boolean>;
  
  abstract handleWebhook(payload: any): Promise<ChatMessage | null>;
  
  async validateConfig(config: Record<string, any>): Promise<ValidationResult> {
    const errors: Record<string, string> = {};
    
    // Check required fields
    for (const field of this.configSchema) {
      if (field.required && (config[field.key] === undefined || config[field.key] === null || config[field.key] === '')) {
        errors[field.key] = `${field.label} is required`;
      }
    }
    
    // Call platform-specific validation
    const platformErrors = await this.onValidateConfig(config);
    
    // Merge errors
    Object.assign(errors, platformErrors);
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  // Platform-specific validation, returns errors object
  protected async onValidateConfig(config: Record<string, any>): Promise<Record<string, string>> {
    // Default implementation returns no errors
    return {};
  }
  
  async getConnectionStatus(): Promise<ConnectionStatus> {
    if (!this.enabled) {
      return {
        connected: false,
        error: 'Plugin is not enabled'
      };
    }
    
    try {
      // Call platform-specific status check
      return await this.onGetConnectionStatus();
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  // Platform-specific connection status check
  protected abstract onGetConnectionStatus(): Promise<ConnectionStatus>;
  
  // Helper method to create a standard outgoing message
  protected createOutgoingMessage(
    agentId: number,
    content: string,
    userId: string,
    messageType: ChatMessage['messageType'] = 'text',
    metadata?: Record<string, any>,
    attachments?: ChatMessage['attachments']
  ): ChatMessage {
    return {
      agentId,
      platform: this.platform,
      direction: 'outgoing',
      messageType,
      content,
      metadata,
      timestamp: new Date(),
      userId,
      attachments
    };
  }
  
  // Helper method to create a standard incoming message
  protected createIncomingMessage(
    agentId: number,
    content: string,
    userId: string,
    userName?: string,
    messageType: ChatMessage['messageType'] = 'text',
    metadata?: Record<string, any>,
    attachments?: ChatMessage['attachments']
  ): ChatMessage {
    return {
      agentId,
      platform: this.platform,
      direction: 'incoming',
      messageType,
      content,
      metadata,
      timestamp: new Date(),
      userId,
      userName,
      attachments
    };
  }
}
