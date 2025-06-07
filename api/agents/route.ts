import { NextRequest, NextResponse } from "next/server"
import { agentDb } from "@/lib/database/agent-db"
import { getAuthenticatedUserId, requireAuth } from "@/lib/auth-utils"

// GET /api/agents - List all agents
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
    
    // Query agents from our SQLite database
    const agents = await agentDb.query({ userId });
    
    return NextResponse.json({ agents })
  } catch (error) {
    console.error("Error fetching agents:", error)
    // Return empty array instead of error to avoid breaking the UI
    return NextResponse.json({ agents: [] })
  }
}

// POST /api/agents - Create a new agent
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authError = await requireAuth(req);
    if (authError) return authError;
    
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const { 
      name, 
      description, 
      isActive = true,
      chatbotName,
      systemPrompt,
      topColor,
      accentColor,
      backgroundColor,
      avatarUrl,
      workflowId
    } = await req.json()
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Insert new agent into our SQLite database
    const newAgent = await agentDb.create({
      name,
      description,
      userId, // Use the authenticated user ID
      status: isActive ? 'online' : 'offline',
      is_active: isActive,
      chatbot_name: chatbotName || name,
      system_prompt: systemPrompt,
      top_color: topColor,
      accent_color: accentColor,
      background_color: backgroundColor,
      avatar_url: avatarUrl,
      workflow_id: workflowId
    });
    
    return NextResponse.json({ agent: newAgent }, { status: 201 })
  } catch (error) {
    console.error("Error creating agent:", error)
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 })
  }
}

// PUT /api/agents/:id - Update an existing agent
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
    
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    
    const { 
      name, 
      description, 
      isActive,
      chatbotName,
      systemPrompt,
      topColor,
      accentColor,
      backgroundColor,
      avatarUrl,
      workflowId
    } = await req.json()
    
    // Update the agent in our SQLite database
    const updatedAgent = await agentDb.update(parseInt(id, 10), {
      name,
      description,
      status: isActive ? 'online' : 'offline',
      is_active: isActive,
      chatbot_name: chatbotName,
      system_prompt: systemPrompt,
      top_color: topColor,
      accent_color: accentColor,
      background_color: backgroundColor,
      avatar_url: avatarUrl,
      workflow_id: workflowId
    });
    
    return NextResponse.json({ agent: updatedAgent })
  } catch (error) {
    console.error("Error updating agent:", error)
    
    if ((error as Error).message.includes('not found')) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }
    
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 })
  }
}
