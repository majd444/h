// Placeholder implementation for botpress service
export interface BotpressMessage {
  type: string;
  content: string;
  userId?: string;
  conversationId?: string;
}

export interface BotpressConversation {
  id: string;
  messages: BotpressMessage[];
  userId?: string;
}

class BotpressService {
  async sendMessage(message: BotpressMessage): Promise<BotpressMessage> {
    console.log('Botpress message sent:', message);
    return {
      type: 'text',
      content: 'This is a placeholder response from the Botpress service',
      userId: message.userId,
      conversationId: message.conversationId
    };
  }

  async getConversation(conversationId: string): Promise<BotpressConversation> {
    console.log('Getting conversation:', conversationId);
    return {
      id: conversationId,
      messages: [
        {
          type: 'text',
          content: 'This is a placeholder conversation from the Botpress service',
          userId: 'user-123',
          conversationId
        }
      ]
    };
  }
}

// Export a singleton instance as default
const botpressService = new BotpressService();
export default botpressService;
