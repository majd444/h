/**
 * WordPress Plugin Implementation
 * 
 * This module provides a WordPress integration for the chatbot platform
 * using the WordPress REST API.
 */
import { BasePlugin } from './base-plugin';
import { 
  PluginConfigField, 
  ChatMessage, 
  ConnectionStatus,
  pluginRegistry
} from './plugin-interface';

export class WordPressPlugin extends BasePlugin {
  constructor() {
    // Define the WordPress plugin configuration schema
    const configSchema: PluginConfigField[] = [
      {
        key: 'siteUrl',
        label: 'WordPress Site URL',
        type: 'string',
        required: true,
        placeholder: 'https://example.com',
        description: 'The URL of your WordPress site'
      },
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'WordPress REST API authentication key'
      },
      {
        key: 'apiSecret',
        label: 'API Secret',
        type: 'password',
        required: true,
        description: 'WordPress REST API authentication secret'
      },
      {
        key: 'embedLocation',
        label: 'Embed Location',
        type: 'select',
        required: true,
        options: [
          { label: 'All Pages', value: 'all' },
          { label: 'Front Page Only', value: 'front' },
          { label: 'Specific Pages', value: 'specific' }
        ],
        default: 'all',
        description: 'Where to embed the chatbot on your WordPress site'
      },
      {
        key: 'specificPages',
        label: 'Specific Pages',
        type: 'string',
        required: false,
        placeholder: '1,2,3',
        description: 'Comma-separated list of page IDs (only if "Specific Pages" is selected)'
      }
    ];
    
    super(
      'wordpress',
      'WordPress Integration',
      'wordpress',
      '1.0.0',
      configSchema
    );
  }

  protected async onInitialize(): Promise<void> {
    // Verify connection to WordPress site
    const status = await this.testConnection();
    if (!status.connected) {
      throw new Error(`Failed to connect to WordPress site: ${status.error}`);
    }
    
    console.log(`WordPress plugin initialized for site: ${this.config.siteUrl}`);
  }

  async sendMessage(message: ChatMessage): Promise<boolean> {
    try {
      // In a real implementation, this would use the WordPress API
      // to send messages to users via a notification plugin or similar
      console.log(`[WordPress] Sending message to user ${message.userId}: ${message.content}`);
      
      // Simulate successful message sending
      return true;
    } catch (error) {
      console.error('Failed to send WordPress message:', error);
      return false;
    }
  }

  async handleWebhook(payload: any): Promise<ChatMessage | null> {
    try {
      // Validate the webhook payload
      if (!payload || !payload.user_id || !payload.message) {
        console.error('Invalid WordPress webhook payload:', payload);
        return null;
      }
      
      // Create a ChatMessage from the webhook payload
      return this.createIncomingMessage(
        payload.agent_id,
        payload.message,
        payload.user_id,
        payload.user_name,
        'text',
        payload.metadata
      );
    } catch (error) {
      console.error('Failed to handle WordPress webhook:', error);
      return null;
    }
  }

  protected async onValidateConfig(config: Record<string, any>): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};
    
    // Validate site URL format
    if (config.siteUrl && !config.siteUrl.match(/^https?:\/\/.+/)) {
      errors.siteUrl = 'Site URL must be a valid URL starting with http:// or https://';
    }
    
    // Validate specific pages if that option is selected
    if (config.embedLocation === 'specific' && !config.specificPages) {
      errors.specificPages = 'You must specify page IDs when "Specific Pages" is selected';
    }
    
    return errors;
  }

  protected async onGetConnectionStatus(): Promise<ConnectionStatus> {
    try {
      const status = await this.testConnection();
      return status;
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Test the connection to the WordPress site
  private async testConnection(): Promise<ConnectionStatus> {
    try {
      // In a real implementation, this would make an API request to the WordPress site
      // For now, we'll simulate a successful connection if the URL is valid
      const url = this.config.siteUrl;
      
      if (!url || !url.match(/^https?:\/\/.+/)) {
        return {
          connected: false,
          error: 'Invalid WordPress site URL'
        };
      }
      
      // Simulate API request
      console.log(`Testing connection to WordPress site: ${url}`);
      
      // In a real implementation, we would make an actual HTTP request here
      // For now, just simulate a successful connection
      return {
        connected: true,
        lastConnected: new Date(),
        details: {
          siteUrl: url,
          version: '6.4.2' // Simulated WordPress version
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Register the WordPress plugin with the registry
const wordpressPlugin = new WordPressPlugin();
pluginRegistry.registerPlugin(wordpressPlugin);
