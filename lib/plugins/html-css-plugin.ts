/**
 * HTML & CSS Plugin Implementation
 * 
 * This module provides a direct HTML & CSS integration for embedding 
 * the chatbot on any website with custom styling.
 */
import { BasePlugin } from './base-plugin';
import { 
  PluginConfigField, 
  ChatMessage, 
  ConnectionStatus,
  pluginRegistry
} from './plugin-interface';

export class HtmlCssPlugin extends BasePlugin {
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
      }
    ];
    
    super(
      'html-css',
      'HTML & CSS Integration',
      'html-css',
      '1.0.0',
      configSchema
    );
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
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  // Generate embed code for the chatbot
  async generateEmbedCode(agentId: number, userId: string): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.example.com';
    const embedScript = `
<!-- Chatbot Widget Embed Code -->
<script>
  (function(w, d, s, o, f, js, fjs) {
    w['ChatbotWidget'] = o;
    w[o] = w[o] || function() { (w[o].q = w[o].q || []).push(arguments) };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o; js.src = f; js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'chatbot', '${baseUrl}/api/embed/chatbot.js'));
  
  chatbot('init', {
    agentId: ${agentId},
    userId: '${userId}',
    primaryColor: '${this.config.primaryColor || '#0084ff'}',
    position: '${this.config.position || 'bottom-right'}',
    title: '${this.config.chatbotTitle || 'Chat with us'}',
    autoOpen: ${this.config.autoOpen ? 'true' : 'false'},
    showOnMobile: ${this.config.showOnMobile ? 'true' : 'false'}
  });
</script>
<!-- End Chatbot Widget Embed Code -->
    `.trim();
    
    return embedScript;
  }
}

// Register the HTML & CSS plugin with the registry
const htmlCssPlugin = new HtmlCssPlugin();
pluginRegistry.registerPlugin(htmlCssPlugin);
