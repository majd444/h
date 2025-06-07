/**
 * Agentive API Service
 * 
 * This service provides functions to interact with the Agentive API for chatbot functionality.
 */

// Default API key - in production, this should be stored in environment variables
const DEFAULT_API_KEY = "c8bc40f2-e83d-4e92-ac2b-d5bd6444da0a";
const DEFAULT_ASSISTANT_ID = "25fd29f8-8365-4ce2-b3f2-f78e1b57f148";

interface AgentiveMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentiveSessionResponse {
  session_id: string;
}

interface AgentiveChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

/**
 * Create a new chat session with the Agentive API
 * @param apiKey Optional custom API key
 * @param assistantId Optional custom assistant ID
 * @returns Session ID for subsequent chat requests
 */
export async function createAgentiveSession(
  apiKey: string = DEFAULT_API_KEY,
  assistantId: string = DEFAULT_ASSISTANT_ID
): Promise<string> {
  try {
    const response = await fetch('https://agentivehub.com/api/chat/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        assistant_id: assistantId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create session: ${response.status} - ${errorData}`);
    }

    const data = await response.json() as AgentiveSessionResponse;
    return data.session_id;
  } catch (error) {
    console.error('Error creating Agentive session:', error);
    throw new Error('Failed to initialize chat session with Agentive');
  }
}

/**
 * Send a message to an existing Agentive chat session
 * @param sessionId The session ID from createAgentiveSession
 * @param messages Array of messages to send
 * @param apiKey Optional custom API key
 * @param assistantId Optional custom assistant ID
 * @returns The AI response
 */
export async function sendAgentiveMessage(
  sessionId: string,
  messages: AgentiveMessage[],
  apiKey: string = DEFAULT_API_KEY,
  assistantId: string = DEFAULT_ASSISTANT_ID
): Promise<string> {
  try {
    const response = await fetch('https://agentivehub.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        session_id: sessionId,
        type: 'custom_code',
        assistant_id: assistantId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send message: ${response.status} - ${errorData}`);
    }

    const data = await response.json() as AgentiveChatResponse;
    
    // Extract the response content from the choices
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from Agentive API');
    }
  } catch (error) {
    console.error('Error sending message to Agentive:', error);
    throw new Error('Failed to get response from Agentive');
  }
}
