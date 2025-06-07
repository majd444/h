/**
 * LLM Service
 * 
 * This service provides functions to interact with language models through OpenRouter API.
 */

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

interface ChatCompletionResponse {
  response: string;
  model: string;
}

class LlmService {
  /**
   * Generate a chat completion using OpenRouter API
   * @param options Chat completion options including messages and parameters
   * @returns The AI response and model information
   */
  async generateChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      // Use Llama 3.1 as default model or get from environment variable
      const model = options.model || process.env.DEFAULT_MODEL || 'meta-llama/llama-3.1-8b-instruct';
      
      console.log('Environment variables check:');
      console.log(`- FALLBACK_MODE: ${process.env.FALLBACK_MODE}`);
      console.log(`- API KEY exists: ${!!process.env.OPENROUTER_API_KEY}`);
      console.log(`- DEFAULT_MODEL: ${process.env.DEFAULT_MODEL}`);
      
      // Check if fallback mode is enabled
      const fallbackMode = process.env.FALLBACK_MODE === 'true';
      
      // Get API key from environment variable
      const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
      
      // If fallback mode is enabled or no API key is available, provide a fallback response
      if (fallbackMode || !apiKey) {
        console.warn(`Using fallback response mode. Fallback mode: ${fallbackMode}, API key exists: ${!!apiKey}`);
        return this.generateFallbackResponse(options.messages);
      }
      
      // Determine which API to use based on available keys
      const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
      
      // Set up API endpoint and headers
      const endpoint = isOpenRouter 
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(isOpenRouter && {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'AI Agent Application'
        })
      };
      
      // Prepare request body - handle differences between OpenRouter and OpenAI format
      let requestBody;
      
      if (isOpenRouter) {
        // OpenRouter specific format
        requestBody = {
          model: model,
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
          transforms: ["middle-out"], // OpenRouter optimization
          route: "fallback" // Ensure we get a response even if the primary model is busy
        };
        
        console.log('Using OpenRouter format with model:', model);
      } else {
        // Standard OpenAI format
        requestBody = {
          model: model,
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
        };
      }
      
      // Make API request with retry logic
      let response;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} - Making API request to: ${endpoint}`);
          console.log(`Using model: ${model}`);
          
          // Add timeout to the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
          
          break; // If successful, exit the retry loop
        } catch (fetchError) {
          retryCount++;
          console.error(`API request attempt ${retryCount} failed:`, fetchError);
          
          if (retryCount > maxRetries) {
            throw fetchError; // Re-throw after max retries
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }
      
      if (!response || !response.ok) {
        let errorMessage = `API request failed with status ${response?.status || 'unknown'}`;
        let errorData = {};
        
        try {
          if (response) {
            const responseText = await response.text();
            try {
              errorData = JSON.parse(responseText);
              errorMessage += `: ${JSON.stringify(errorData)}`;
            } catch (parseError) {
              // Handle JSON parse error - use text content instead
              errorMessage += `: ${responseText.substring(0, 100)}`;
              console.warn('Could not parse error response as JSON:', parseError);
            }
          }
        } catch (readError) {
          console.error('Error reading error response:', readError);
        }
        
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse JSON response with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON from API response:', jsonError);
        throw new Error('Failed to parse response from AI service');
      }
      
      // Log successful response for debugging
      console.log('API response received, structure:', Object.keys(data));
      
      // Extract the response text with more robust error handling for both OpenAI and OpenRouter formats
      let responseText = '';
      let modelName = model;
      
      // Handle OpenAI/OpenRouter format
      if (data.choices && data.choices.length > 0) {
        if (data.choices[0].message) {
          responseText = data.choices[0].message.content || '';
        } else if (data.choices[0].text) {
          responseText = data.choices[0].text || '';
        }
        modelName = data.model || model;
      } 
      // Handle possible alternative formats
      else if (data.message) {
        responseText = data.message.content || data.message;
      } else if (data.output) {
        // Some providers might use different formats
        responseText = data.output;
      } else if (data.response) {
        // Direct response property
        responseText = data.response;
      }
      
      if (!responseText) {
        console.warn('API response did not contain expected content:', JSON.stringify(data).substring(0, 500));
        responseText = "I'm having trouble understanding the response from my AI provider. Please try again later.";
      } else {
        console.log('Successfully extracted response text, length:', responseText.length);
      }
      
      return {
        response: responseText,
        model: modelName
      };
      
    } catch (error) {
      console.error('Error in LLM service:', error);
      return this.generateFallbackResponse(options.messages);
    }
  }

  /**
   * Generate a fallback response when API is not available
   * @param messages The conversation messages
   * @returns A simulated AI response
   */
  generateFallbackResponse(messages: Message[]): ChatCompletionResponse {
    // Get the last user message
    const lastUserMessage = messages.findLast(m => m.role === 'user')?.content || '';
    
    // Generate a simple fallback response
    let response = "I'm currently operating in fallback mode and cannot access my AI provider.";
    
    // Add some context based on the user's message
    if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
      response += " Hello! I'm here to help, but my capabilities are limited right now.";
    } else if (lastUserMessage.includes('help')) {
      response += " I'd like to help, but my capabilities are limited in fallback mode.";
    } else {
      response += " Please try again later when my connection to the AI service is restored.";
    }
    
    return {
      response,
      model: 'fallback-model'
    };
  }
}

// Create and export a singleton instance
const llmService = new LlmService();
export default llmService;
