/**
 * Plugin Interface for External Platform Integration
 * 
 * This module defines the interface for chatbot platform integrations
 * such as WordPress, WhatsApp, Instagram, Messenger, Telegram, and Discord.
 */

// Base plugin interface that all platform integrations must implement
export interface ChatbotPlugin {
  // Unique identifier for the plugin
  id: string;
  
  // Display name of the plugin
  name: string;
  
  // Platform this plugin integrates with (e.g., "wordpress", "whatsapp")
  platform: string;
  
  // Plugin version
  version: string;
  
  // Whether the plugin is currently enabled
  enabled: boolean;
  
  // Configuration schema for the plugin
  configSchema: PluginConfigField[];
  
  // Current configuration values
  config: Record<string, any>;
  
  // Initialize the plugin with configuration
  initialize(config: Record<string, any>): Promise<boolean>;
  
  // Send a message to the platform
  sendMessage(message: ChatMessage): Promise<boolean>;
  
  // Receive messages from the platform (webhook handler)
  handleWebhook(payload: any): Promise<ChatMessage | null>;
  
  // Validate the plugin configuration
  validateConfig(config: Record<string, any>): Promise<ValidationResult>;
  
  // Get the connection status
  getConnectionStatus(): Promise<ConnectionStatus>;
}

// Configuration field definition for plugin settings
export interface PluginConfigField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'password';
  required: boolean;
  default?: any;
  options?: { label: string; value: string }[]; // For select type
  placeholder?: string;
  description?: string;
}

// Message structure for sending/receiving messages
export interface ChatMessage {
  id?: string;
  agentId: number;
  platform: string;
  direction: 'incoming' | 'outgoing';
  messageType: 'text' | 'image' | 'file' | 'button' | 'card' | 'custom';
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  userId: string;
  userName?: string;
  attachments?: Attachment[];
}

// Attachment structure for messages with files or media
export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

// Result of configuration validation
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// Connection status for the plugin
export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  error?: string;
  details?: Record<string, any>;
}

// Plugin registration information
export interface PluginRegistration {
  plugin: ChatbotPlugin;
  registeredAt: Date;
}

// Plugin registry to manage all available plugins
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, PluginRegistration> = new Map();

  private constructor() {}

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  public registerPlugin(plugin: ChatbotPlugin): void {
    this.plugins.set(plugin.id, {
      plugin,
      registeredAt: new Date()
    });
  }

  public getPlugin(id: string): ChatbotPlugin | undefined {
    const registration = this.plugins.get(id);
    return registration?.plugin;
  }

  public getAllPlugins(): ChatbotPlugin[] {
    return Array.from(this.plugins.values()).map(reg => reg.plugin);
  }

  public getPluginsByPlatform(platform: string): ChatbotPlugin[] {
    return this.getAllPlugins().filter(plugin => plugin.platform === platform);
  }

  public unregisterPlugin(id: string): boolean {
    return this.plugins.delete(id);
  }
}

// Export singleton instance
export const pluginRegistry = PluginRegistry.getInstance();
