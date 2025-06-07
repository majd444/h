import { NextResponse } from 'next/server';
import llmService from '@/lib/services/llm';

export async function POST(req: Request) {
  try {
    console.log('=====================================');
    console.log('Chat API called with environment:');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`- FALLBACK_MODE: ${process.env.FALLBACK_MODE}`);
    console.log(`- API KEY exists: ${!!process.env.OPENROUTER_API_KEY}`);
    console.log(`- API KEY length: ${process.env.OPENROUTER_API_KEY?.length || 0}`);
    console.log(`- DEFAULT_MODEL: ${process.env.DEFAULT_MODEL}`);
    console.log('=====================================');
    
    const { messages, systemPrompt, temperature = 0.7 } = await req.json();
    
    // Convert messages to the format expected by our LLM service
    const formattedMessages = [
      // Add system prompt if provided
      systemPrompt ? { role: 'system', content: systemPrompt } : null,
      // Add the user messages
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ].filter(Boolean); // Remove null entries
    
    // Call our LLM service that uses the OpenRouter API key from .env
    const result = await llmService.generateChatCompletion({
      messages: formattedMessages,
      temperature: parseFloat(temperature)
    });
    
    return NextResponse.json({ 
      response: result.response,
      model: result.model
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
