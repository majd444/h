import { NextResponse } from 'next/server';
import { createAgentiveSession, sendAgentiveMessage } from '@/lib/services/agentive-api';

// Store sessions in memory (in production, use a database or Redis)
const sessions: Record<string, string> = {};

export async function POST(req: Request) {
  try {
    const { messages, agentId } = await req.json();
    
    // Get or create a session for this agent
    let sessionId = sessions[agentId];
    
    if (!sessionId) {
      console.log(`Creating new Agentive session for agent ${agentId}`);
      // Use environment variables if available, otherwise use defaults from the service
      const apiKey = process.env.AGENTIVE_API_KEY;
      const assistantId = process.env.AGENTIVE_ASSISTANT_ID || agentId;
      
      sessionId = await createAgentiveSession(apiKey, assistantId);
      sessions[agentId] = sessionId;
      console.log(`Created session ${sessionId} for agent ${agentId}`);
    }
    
    // Format messages for Agentive API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Send message to Agentive API
    const response = await sendAgentiveMessage(
      sessionId, 
      formattedMessages,
      process.env.AGENTIVE_API_KEY,
      process.env.AGENTIVE_ASSISTANT_ID || agentId
    );
    
    return NextResponse.json({ 
      response: response,
      model: "agentive"
    });
  } catch (error) {
    console.error('Error in Agentive chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response from Agentive' },
      { status: 500 }
    );
  }
}
