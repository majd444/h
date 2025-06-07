import { NextRequest, NextResponse } from "next/server";
// Commented out for now as it will be used when auth is implemented
// import { getServerSession } from "next-auth/next";

type IntegrationCredential = {
  id: string;
  name: string;
  credentials: Record<string, string>;
  isActive: boolean;
  updatedAt: Date;
};

// Temporary in-memory store - in a real app, this would be stored in a database
const integrationStore: Record<string, IntegrationCredential[]> = {};

export async function GET(_req: NextRequest) {
  try {
    // In a real implementation, authenticate the user and get their session
    // const session = await getServerSession();
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // For now, we'll use a mock userId
    const userId = "user-1";
    
    const integrations = integrationStore[userId] || [];
    return NextResponse.json({ integrations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // In a real implementation, authenticate the user and get their session
    // const session = await getServerSession();
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // For now, we'll use a mock userId
    const userId = "user-1";
    
    const data = await req.json();
    
    if (!data.id || !data.name || !data.credentials) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    if (!integrationStore[userId]) {
      integrationStore[userId] = [];
    }
    
    // Check if integration already exists
    const existingIndex = integrationStore[userId].findIndex(
      (integration) => integration.id === data.id
    );
    
    const integration: IntegrationCredential = {
      id: data.id,
      name: data.name,
      credentials: data.credentials,
      isActive: data.isActive || true,
      updatedAt: new Date(),
    };
    
    if (existingIndex >= 0) {
      // Update existing integration
      integrationStore[userId][existingIndex] = integration;
    } else {
      // Add new integration
      integrationStore[userId].push(integration);
    }
    
    return NextResponse.json({ integration }, { status: 200 });
  } catch (error) {
    console.error("Error saving integration:", error);
    return NextResponse.json(
      { error: "Failed to save integration" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // In a real implementation, authenticate the user and get their session
    // const session = await getServerSession();
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // For now, we'll use a mock userId
    const userId = "user-1";
    
    const data = await req.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: "Integration ID is required" },
        { status: 400 }
      );
    }
    
    // Check if integrations exist for user
    if (!integrationStore[userId]) {
      return NextResponse.json(
        { error: "No integrations found" },
        { status: 404 }
      );
    }
    
    // Find integration
    const existingIndex = integrationStore[userId].findIndex(
      (integration) => integration.id === data.id
    );
    
    if (existingIndex === -1) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }
    
    // Update fields
    const updatedIntegration = {
      ...integrationStore[userId][existingIndex],
      ...data,
      updatedAt: new Date(),
    };
    
    integrationStore[userId][existingIndex] = updatedIntegration;
    
    return NextResponse.json({ integration: updatedIntegration }, { status: 200 });
  } catch (error) {
    console.error("Error updating integration:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // In a real implementation, authenticate the user and get their session
    // const session = await getServerSession();
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Integration ID is required" },
        { status: 400 }
      );
    }
    
    // For now, we'll use a mock userId
    const userId = "user-1";
    
    // Check if integrations exist for user
    if (!integrationStore[userId]) {
      return NextResponse.json(
        { error: "No integrations found" },
        { status: 404 }
      );
    }
    
    // Find and remove integration
    const existingIndex = integrationStore[userId].findIndex(
      (integration) => integration.id === id
    );
    
    if (existingIndex === -1) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }
    
    integrationStore[userId].splice(existingIndex, 1);
    
    return NextResponse.json(
      { message: "Integration deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}
