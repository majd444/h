/**
 * Embedded Chat API Route
 * 
 * This route handles chat messages from the embedded chat interface
 * and forwards them to the appropriate agent.
 */
import { NextRequest, NextResponse } from "next/server";
import llmService from '@/lib/services/llm';
import { agentDb } from '@/lib/database/agent-db';
import { pluginDb } from '@/lib/database/plugin-db';
import { pluginRegistry } from '@/lib/plugins/plugin-registry-loader';

// POST /api/embed/chat - Process messages from embedded chat
export async function POST(req: NextRequest) {
  try {
    const { agentId, userId, message } = await req.json();
    
    if (!agentId || !userId || !message) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // Get agent details
    const agent = await agentDb.getAgentById(parseInt(agentId));
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    
    // Check if this agent has HTML & CSS plugin configured
    const pluginConfigs = await pluginDb.getPluginConfigsForAgent(parseInt(agentId));
    const htmlCssConfig = pluginConfigs.find(config => config.pluginId === 'html-css');
    
    if (!htmlCssConfig) {
      return NextResponse.json({ error: "HTML & CSS plugin not configured for this agent" }, { status: 403 });
    }
    
    // Get the plugin
    const htmlCssPlugin = pluginRegistry.getPluginById('html-css');
    if (!htmlCssPlugin) {
      return NextResponse.json({ error: "HTML & CSS plugin not available" }, { status: 500 });
    }
    
    // Create a chat message
    const chatMessage = htmlCssPlugin.createIncomingMessage(
      parseInt(agentId),
      message,
      userId,
      "Website Visitor",
      "text"
    );
    
    // Process the message with the agent
    // For now, we'll use the LLM service directly
    // In a production environment, you would use the agent's specific configuration
    
    const systemPrompt = agent.systemPrompt || `You are ${agent.name}, an AI assistant. Answer questions helpfully and accurately.`;
    
    const result = await llmService.generateChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });
    
    // Log the interaction for the plugin
    await pluginDb.logPluginInteraction({
      pluginId: 'html-css',
      agentId: parseInt(agentId),
      userId,
      messageIn: message,
      messageOut: result.response,
      timestamp: new Date()
    });
    
    // Return the response
    return NextResponse.json({ 
      response: result.response,
      model: result.model,
      agentName: agent.name
    });
  } catch (error) {
    console.error('Error in embedded chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
