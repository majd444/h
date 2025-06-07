/**
 * WhatsApp Plugin Implementation
 * 
 * This module provides a WhatsApp integration for the chatbot platform
 * using the WhatsApp Business API.
 */
import { BasePlugin } from './base-plugin';
import { 
  PluginConfigField, 
  ChatMessage, 
  ConnectionStatus,
  pluginRegistry
} from './plugin-interface';

export class WhatsAppPlugin extends BasePlugin {
  constructor() {
    // Define the WhatsApp plugin configuration schema
    const configSchema: PluginConfigField[] = [
      {
        key: 'phoneNumberId',
        label: 'Phone Number ID',
        type: 'string',
        required: true,
        description: 'Your WhatsApp Business Account phone number ID'
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
        description: 'WhatsApp Business API access token'
      },
      {
        key: 'apiVersion',
        label: 'API Version',
        type: 'string',
        required: true,
        default: 'v17.0',
        description: 'WhatsApp Business API version'
      },
      {
        key: 'verifyToken',
        label: 'Verify Token',
        type: 'string',
        required: true,
        description: 'Token for webhook verification'
      },
      {
        key: 'businessName',
        label: 'Business Name',
        type: 'string',
        required: true,
        description: 'Your business name to display to users'
      }
    ];
    
    super(
      'whatsapp',
      'WhatsApp Integration',
      'whatsapp',
      '1.0.0',
      configSchema
    );
  }

  protected async onInitialize(): Promise<void> {
    // Verify WhatsApp Business API credentials
    const status = await this.testConnection();
    if (!status.connected) {
      throw new Error(`Failed to connect to WhatsApp Business API: ${status.error}`);
    }
    
    console.log(`WhatsApp plugin initialized for business: ${this.config.businessName}`);
  }

  async sendMessage(message: ChatMessage): Promise<boolean> {
    try {
      // In a real implementation, this would use the WhatsApp Business API
      // to send messages to users
      console.log(`[WhatsApp] Sending message to user ${message.userId}: ${message.content}`);
      
      // Prepare the message payload
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: message.userId,
        type: "text",
        text: {
          preview_url: false,
          body: message.content
        }
      };
      
      // In a real implementation, we would make an API call here
      // For now, just log the payload
      console.log('WhatsApp API payload:', payload);
      
      // Simulate successful message sending
      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  async handleWebhook(payload: any): Promise<ChatMessage | null> {
    try {
      // Validate the webhook payload
      if (!payload || !payload.entry || !payload.entry[0] || !payload.entry[0].changes) {
        console.error('Invalid WhatsApp webhook payload:', payload);
        return null;
      }
      
      // Extract the message data
      const entry = payload.entry[0];
      const changes = entry.changes[0];
      
      if (!changes.value || !changes.value.messages || !changes.value.messages[0]) {
        console.error('No message in WhatsApp webhook payload');
        return null;
      }
      
      const message = changes.value.messages[0];
      const sender = message.from;
      const messageText = message.text?.body || '';
      
      // Create a ChatMessage from the webhook payload
      return this.createIncomingMessage(
        payload.agent_id || 1, // Default to agent ID 1 if not specified
        messageText,
        sender,
        undefined, // WhatsApp doesn't provide user names in webhooks
        'text',
        {
          messageId: message.id,
          timestamp: message.timestamp,
          type: message.type
        }
      );
    } catch (error) {
      console.error('Failed to handle WhatsApp webhook:', error);
      return null;
    }
  }

  protected async onValidateConfig(config: Record<string, any>): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};
    
    // Validate phone number ID format
    if (config.phoneNumberId && !config.phoneNumberId.match(/^\d+$/)) {
      errors.phoneNumberId = 'Phone Number ID must contain only digits';
    }
    
    // Validate access token (simple length check)
    if (config.accessToken && config.accessToken.length < 10) {
      errors.accessToken = 'Access Token is too short';
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

  // Test the connection to the WhatsApp Business API
  private async testConnection(): Promise<ConnectionStatus> {
    try {
      // In a real implementation, this would make an API request to the WhatsApp Business API
      // For now, we'll simulate a successful connection if the required config is present
      const { phoneNumberId, accessToken } = this.config;
      
      if (!phoneNumberId || !accessToken) {
        return {
          connected: false,
          error: 'Missing required WhatsApp Business API credentials'
        };
      }
      
      // Simulate API request
      console.log(`Testing connection to WhatsApp Business API for phone number ID: ${phoneNumberId}`);
      
      // In a real implementation, we would make an actual HTTP request here
      // For now, just simulate a successful connection
      return {
        connected: true,
        lastConnected: new Date(),
        details: {
          phoneNumberId,
          businessName: this.config.businessName
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

// Register the WhatsApp plugin with the registry
const whatsappPlugin = new WhatsAppPlugin();
pluginRegistry.registerPlugin(whatsappPlugin);
