/**
 * Enhanced HTML & CSS Plugin Implementation
 * 
 * This module provides a direct HTML & CSS integration for embedding 
 * the chatbot on any website with custom styling and API usage tracking.
 */
import { BasePlugin } from './base-plugin';
import { 
  PluginConfigField, 
  ChatMessage, 
  ConnectionStatus,
  pluginRegistry
} from './plugin-interface';
import axios from 'axios';

export class HtmlCssPluginEnhanced extends BasePlugin {
  private apiUsageEndpoint: string;

  constructor() {
    // Define the HTML & CSS plugin configuration schema
    const configSchema: PluginConfigField[] = [
      {
        key: 'allowedDomains',
        label: 'Allowed Domains',
        type: 'string',
        required: true,
        placeholder: 'example.com,subdomain.example.com',
        description: 'Comma-separated list of domains where the chatbot can be embedded'
      },
      {
        key: 'chatbotTitle',
        label: 'Chatbot Title',
        type: 'string',
        required: true,
        default: 'Chat with us',
        description: 'Title displayed on the chatbot widget'
      },
      {
        key: 'primaryColor',
        label: 'Primary Color',
        type: 'string',
        required: true,
        default: '#0084ff',
        description: 'Primary color for the chatbot widget (hex code)'
      },
      {
        key: 'secondaryColor',
        label: 'Secondary Color',
        type: 'string',
        required: false,
        default: '#ffffff',
        description: 'Secondary color for the chatbot widget (hex code)'
      },
      {
        key: 'position',
        label: 'Widget Position',
        type: 'select',
        required: true,
        options: [
          { label: 'Bottom Right', value: 'bottom-right' },
          { label: 'Bottom Left', value: 'bottom-left' },
          { label: 'Top Right', value: 'top-right' },
          { label: 'Top Left', value: 'top-left' }
        ],
        default: 'bottom-right',
        description: 'Position of the chatbot widget on the page'
      },
      {
        key: 'customCSS',
        label: 'Custom CSS',
        type: 'string',
        required: false,
        description: 'Custom CSS to apply to the chatbot widget'
      },
      {
        key: 'autoOpen',
        label: 'Auto Open',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Automatically open the chatbot widget when the page loads'
      },
      {
        key: 'showOnMobile',
        label: 'Show on Mobile',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Whether to show the chatbot widget on mobile devices'
      },
      {
        key: 'trackApiUsage',
        label: 'Track API Usage',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Whether to track API usage for billing purposes'
      },
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'string',
        required: false,
        description: 'API key for tracking usage (if empty, will use default)'
      }
    ];
    
    super(
      'html-css-enhanced',
      'HTML & CSS Integration (Enhanced)',
      'html-css',
      '1.1.0',
      configSchema
    );

    // Set the API usage tracking endpoint
    this.apiUsageEndpoint = process.env.API_USAGE_ENDPOINT || 'http://localhost:3001/api/usage/track';
  }

  protected async onInitialize(): Promise<void> {
    // Verify the configuration
    const domains = this.config.allowedDomains?.split(',').map((d: string) => d.trim()) || [];
    
    if (domains.length === 0) {
      throw new Error('At least one allowed domain must be specified');
    }
    
    console.log(`HTML & CSS plugin initialized with ${domains.length} allowed domains`);
  }

  async sendMessage(message: ChatMessage): Promise<boolean> {
    try {
      // In a real implementation, this would use a WebSocket or similar
      // to send messages to the embedded chatbot
      console.log(`[HTML & CSS] Sending message to user ${message.userId}: ${message.content}`);
      
      // Track API usage if enabled
      if (this.config.trackApiUsage) {
        await this.trackApiUsage(message.agentId, message.userId, 'sendMessage', message.content);
      }
      
      // Simulate successful message sending
      return true;
    } catch (error) {
      console.error('Failed to send HTML & CSS message:', error);
      return false;
    }
  }

  async handleWebhook(payload: any): Promise<ChatMessage | null> {
    try {
      // Validate the webhook payload
      if (!payload || !payload.userId || !payload.message) {
        console.error('Invalid HTML & CSS webhook payload:', payload);
        return null;
      }
      
      // Track API usage if enabled
      if (this.config.trackApiUsage) {
        await this.trackApiUsage(payload.agentId, payload.userId, 'handleWebhook', payload.message);
      }
      
      // Create a ChatMessage from the webhook payload
      return this.createIncomingMessage(
        payload.agentId,
        payload.message,
        payload.userId,
        payload.userName,
        'text',
        payload.metadata
      );
    } catch (error) {
      console.error('Failed to handle HTML & CSS webhook:', error);
      return null;
    }
  }

  protected async onValidateConfig(config: Record<string, any>): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};
    
    // Validate allowed domains
    if (config.allowedDomains) {
      const domains = config.allowedDomains.split(',').map((d: string) => d.trim());
      
      if (domains.length === 0) {
        errors.allowedDomains = 'At least one allowed domain must be specified';
      } else {
        // Check domain format
        const invalidDomains = domains.filter((d: string) => !d.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/));
        
        if (invalidDomains.length > 0) {
          errors.allowedDomains = `Invalid domain format: ${invalidDomains.join(', ')}`;
        }
      }
    }
    
    // Validate color format
    if (config.primaryColor && !config.primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.primaryColor = 'Primary color must be a valid hex color code (e.g., #0084ff)';
    }
    
    if (config.secondaryColor && !config.secondaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.secondaryColor = 'Secondary color must be a valid hex color code (e.g., #ffffff)';
    }
    
    return errors;
  }

  protected async onGetConnectionStatus(): Promise<ConnectionStatus> {
    // For HTML & CSS integration, there's no persistent connection to check
    // Instead, we'll just verify that the configuration is valid
    
    try {
      const validationResult = await this.validateConfig(this.config);
      
      if (!validationResult.valid) {
        return {
          connected: false,
          error: 'Invalid configuration',
          details: {
            errors: validationResult.errors
          }
        };
      }
      
      return {
        connected: true,
        lastConnected: new Date(),
        details: {
          allowedDomains: this.config.allowedDomains?.split(',').map((d: string) => d.trim()) || []
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: 'Failed to check connection status',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generate embed code for this plugin
   */
  async generateEmbedCode(agentId: number): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const userId = Math.random().toString(36).substring(2, 15);
    
    return `
<!-- Chatbot Embed Code -->
<script>
  (function(w, d, s, o, f, js, fjs) {
    w['ChatbotWidget'] = o;
    w[o] = w[o] || function() {
      (w[o].q = w[o].q || []).push(arguments)
    };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o;
    js.src = f;
    js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'cw', '${baseUrl}/api/embed/chatbot.js'));
  
  cw('init', {
    agentId: "${agentId}",
    userId: "${userId}",
    primaryColor: "${this.config.primaryColor || '#0084ff'}",
    position: "${this.config.position || 'bottom-right'}",
    title: "${this.config.chatbotTitle || 'Chat with us'}",
    autoOpen: ${this.config.autoOpen || false},
    showOnMobile: ${this.config.showOnMobile !== false}
  });
</script>
<!-- End Chatbot Embed Code -->
    `.trim();
  }

  /**
   * Track API usage for billing purposes
   */
  private async trackApiUsage(agentId: number, userId: string, endpoint: string, message: string): Promise<void> {
    try {
      // Calculate approximate token usage
      const tokens = message.split(' ').length;
      
      // Get API key from config or use default
      const apiKey = this.config.apiKey || process.env.DEFAULT_API_KEY;
      
      if (!apiKey) {
        console.warn('No API key available for usage tracking');
        return;
      }
      
      // Send usage data to tracking endpoint
      await axios.post(this.apiUsageEndpoint, {
        agentId,
        userId,
        pluginId: this.id,
        endpoint,
        tokens
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      });
    } catch (error) {
      console.error('Failed to track API usage:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Get API usage for a specific user and agent
   */
  async getApiUsage(userId: string, agentId: number, startDate?: string, endDate?: string): Promise<any> {
    try {
      // Get API key from config or use default
      const apiKey = this.config.apiKey || process.env.DEFAULT_API_KEY;
      
      if (!apiKey) {
        throw new Error('No API key available for usage tracking');
      }
      
      // Build query parameters
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      // Get usage data from tracking endpoint
      const response = await axios.get(this.apiUsageEndpoint, {
        params,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get API usage:', error);
      throw error;
    }
  }
}

// Register the enhanced HTML & CSS plugin with the registry
const htmlCssPluginEnhanced = new HtmlCssPluginEnhanced();
pluginRegistry.registerPlugin(htmlCssPluginEnhanced);

export default htmlCssPluginEnhanced;
