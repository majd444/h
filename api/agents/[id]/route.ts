import { NextRequest, NextResponse } from "next/server"
import { agentDb } from "@/lib/database/agent-db"
import { getAuthenticatedUserId, requireAuth } from "@/lib/auth-utils"

interface Agent {
  id: number;
  name: string;
  description?: string;
  workflow_id?: string;
  chatbot_name?: string;
  system_prompt?: string;
  top_color?: string;
  accent_color?: string;
  background_color?: string;
  avatar_url?: string;
  is_active?: boolean;
  userId?: string;
  created_at?: string;
  updated_at?: string;
}

// GET /api/agents/:id - Get a specific agent by ID
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authError = await requireAuth(req);
    if (authError) return authError;
    
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Extract the ID from the URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    
    console.log(`Fetching agent with ID: ${id}`)
    const agentId = parseInt(id, 10)
    
    // Query the SQLite database for the specific agent
    const agent = await agentDb.getById(agentId)
    
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }
    
    // Verify the agent belongs to the authenticated user
    if (agent.userId !== userId) {
      return NextResponse.json({ error: "You don't have permission to access this agent" }, { status: 403 })
    }
    
    console.log(`Found agent: ${agent.name}`)
    
    // Transform the agent data to match the expected format
    const transformedAgent = {
      id: agent.id,
      name: agent.name,
      description: agent.description || '',
      workflowId: agent.workflow_id || '1',
      chatbotName: agent.chatbot_name || agent.name,
      systemPrompt: agent.system_prompt || 'You are a helpful AI assistant.',
      topColor: agent.top_color || '#1f2937',
      accentColor: agent.accent_color || '#3B82F6',
      backgroundColor: agent.background_color || '#F3F4F6',
      avatarUrl: agent.avatar_url || '',
      temperature: 0.7,
      extraConfig: {
        conversationStarters: [],
        trainingData: {
          extractedLinks: [],
          uploadedFiles: []
        }
      },
      createdBy: agent.userId || 'default-user',
      createdAt: agent.created_at
    }
    
    return NextResponse.json({ agent: transformedAgent })
  } catch (error) {
    console.error("Error fetching agent:", error)
    // Include more detailed error information in development
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json({ 
      error: "Failed to fetch agent",
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 })
  }
}

// PUT /api/agents/:id - Update a specific agent by ID
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const authError = await requireAuth(req);
    if (authError) return authError;
    
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Extract the ID from the URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    
    const agentId = parseInt(id, 10)
    console.log(`Updating agent with ID: ${agentId}`)
    
    // Verify the agent belongs to the authenticated user
    const existingAgent = await agentDb.getById(agentId);
    if (!existingAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }
    
    if (existingAgent.userId !== userId) {
      return NextResponse.json({ error: "You don't have permission to modify this agent" }, { status: 403 })
    }
    
    // Get the request body
    const body = await req.json()
    console.log('Update request body:', body)
    
    // Transform the incoming data to match the database schema
    const updateData: Partial<Agent> = {
      name: body.name,
      description: body.description,
      workflow_id: body.workflowId,
      chatbot_name: body.chatbotName,
      system_prompt: body.systemPrompt,
      top_color: body.topColor,
      accent_color: body.accentColor,
      background_color: body.backgroundColor,
      avatar_url: body.avatarUrl,
      is_active: body.isActive
    }
    
    // Update the agent in the database
    const updatedAgent = await agentDb.update(agentId, updateData)
    
    // Transform the updated agent data to match the expected format
    const transformedAgent = {
      id: updatedAgent.id,
      name: updatedAgent.name,
      description: updatedAgent.description || '',
      workflowId: updatedAgent.workflow_id || '1',
      chatbotName: updatedAgent.chatbot_name || updatedAgent.name,
      systemPrompt: updatedAgent.system_prompt || 'You are a helpful AI assistant.',
      topColor: updatedAgent.top_color || '#1f2937',
      accentColor: updatedAgent.accent_color || '#3B82F6',
      backgroundColor: updatedAgent.background_color || '#F3F4F6',
      avatarUrl: updatedAgent.avatar_url || '',
      isActive: updatedAgent.is_active,
      createdAt: updatedAgent.created_at,
      updatedAt: updatedAgent.updated_at
    }
    
    console.log(`Agent updated successfully: ${updatedAgent.name}`)
    return NextResponse.json({ agent: transformedAgent })
  } catch (error) {
    console.error("Error updating agent:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json({ 
      error: "Failed to update agent",
      message: errorMessage
    }, { status: 500 })
  }
}

// DELETE /api/agents/:id - Delete a specific agent by ID
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const authError = await requireAuth(req);
    if (authError) return authError;
    
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Extract the ID from the URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    
    const agentId = parseInt(id, 10)
    console.log(`Deleting agent with ID: ${agentId}`)
    
    // Check if the agent exists
    const agent = await agentDb.getById(agentId)
    
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }
    
    // Verify the agent belongs to the authenticated user
    if (agent.userId !== userId) {
      return NextResponse.json({ error: "You don't have permission to delete this agent" }, { status: 403 })
    }
    
    // Delete the agent
    await agentDb.remove(agentId)
    
    console.log(`Agent deleted successfully: ID ${agentId}`)
    return NextResponse.json({ success: true, message: `Agent ${agentId} deleted successfully` })
  } catch (error) {
    console.error("Error deleting agent:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json({ 
      error: "Failed to delete agent",
      message: errorMessage
    }, { status: 500 })
  }
}
