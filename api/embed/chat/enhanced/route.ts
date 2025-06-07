/**
 * Enhanced Embedded Chat API Route
 * 
 * This route handles chat messages from the embedded chat interface,
 * forwards them to the appropriate agent, and tracks API usage for billing.
 */
import { NextRequest, NextResponse } from "next/server";
import llmService from '@/lib/services/llm';
import { agentDb } from '@/lib/database/agent-db';
import { pluginDb } from '@/lib/database/plugin-db';
import { pluginRegistry } from '@/lib/plugins/plugin-registry-loader';
import axios from 'axios';

// Track API usage
async function trackApiUsage(userId: string, agentId: number, pluginId: string, endpoint: string, tokens: number = 0) {
  try {
    // Get the API usage tracking endpoint from environment variables
    const apiUsageEndpoint = process.env.API_USAGE_ENDPOINT || 'http://localhost:3001/api/usage/track';
    const apiKey = process.env.DEFAULT_API_KEY;
    
    if (!apiKey) {
      console.warn('No API key available for usage tracking');
      return;
    }
    
    // Send usage data to tracking endpoint
    await axios.post(apiUsageEndpoint, {
      userId,
      agentId,
      pluginId,
      endpoint,
      tokens
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking API usage:', error);
    return false;
  }
}

// POST /api/embed/chat/enhanced - Process messages from embedded chat with usage tracking
export async function POST(req: NextRequest) {
  try {
    const { agentId, userId, message, visitorId } = await req.json();
    
    if (!agentId || !userId || !message) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // Get agent details
    const agent = await agentDb.getById(parseInt(agentId));
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    
    // Check if this agent has HTML & CSS plugin configured
    const pluginConfigs = await pluginDb.getPluginConfigs(userId, parseInt(agentId));
    const htmlCssConfig = pluginConfigs.find((config) => 
      config.plugin_id === 'html-css' || config.plugin_id === 'html-css-enhanced'
    );
    
    if (!htmlCssConfig) {
      return NextResponse.json({ error: "HTML & CSS plugin not configured for this agent" }, { status: 403 });
    }
    
    // Get the plugin
    const pluginId = htmlCssConfig.plugin_id;
    const htmlCssPlugin = pluginRegistry.getPlugin(pluginId);
    if (!htmlCssPlugin) {
      return NextResponse.json({ error: "HTML & CSS plugin not available" }, { status: 500 });
    }
    
    // Create a chat message
    // Create a message object that conforms to the ChatMessage interface
    // We don't need to use the plugin's methods directly since we're handling the processing here
    const timestamp = new Date();
    const _chatMessage = {
      agentId: parseInt(agentId),
      platform: htmlCssPlugin.platform,
      direction: 'incoming' as const,
      messageType: 'text' as const,
      content: message,
      timestamp,
      userId: userId,
      userName: "Website Visitor"
    };
    
    // Process the message with the agent
    const systemPrompt = agent.systemPrompt || `You are ${agent.name}, an AI assistant. Answer questions helpfully and accurately.`;
    
    const result = await llmService.generateChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });
    
    // Calculate token usage (approximate)
    const promptTokens = message.split(' ').length;
    const responseTokens = result.response.split(' ').length;
    const totalTokens = promptTokens + responseTokens;
    
    // Track API usage
    await trackApiUsage(
      userId, 
      parseInt(agentId), 
      pluginId, 
      '/api/embed/chat/enhanced', 
      totalTokens
    );
    
    // Log the interaction in our server database
    try {
      const serverEndpoint = process.env.PLUGIN_INTERACTION_ENDPOINT || 'http://localhost:3001/api/embed/chat';
      const apiKey = process.env.DEFAULT_API_KEY;
      
      if (apiKey) {
        await axios.post(serverEndpoint, {
          agentId: parseInt(agentId),
          userId,
          visitorId: visitorId || userId,
          message,
          response: result.response,
          tokens: totalTokens
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          }
        });
      }
    } catch (error) {
      console.error('Error logging plugin interaction:', error);
      // Don't fail the request if logging fails
    }
    
    // Return the response
    return NextResponse.json({ 
      response: result.response,
      model: result.model,
      agentName: agent.name,
      tokens: {
        prompt: promptTokens,
        response: responseTokens,
        total: totalTokens
      }
    });
  } catch (error) {
    console.error('Error in enhanced embedded chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
