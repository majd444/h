/**
 * API Routes for Specific Plugin Configuration
 * 
 * This module provides API endpoints for managing a specific plugin configuration
 * including getting details, updating, and deleting.
 */
import { NextRequest, NextResponse } from "next/server";
import { pluginRegistry } from "@/lib/plugins/plugin-interface";
import { pluginDb } from "@/lib/database/plugin-db";
import { getAuthenticatedUserId, requireAuth } from "@/lib/auth-utils";

// Helper function to extract ID from URL path
function extractIdFromUrl(req: NextRequest): string {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  return pathParts[pathParts.length - 1];
}

// GET /api/plugins/:id - Get a specific plugin configuration
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
    const id = extractIdFromUrl(req);
    const configId = parseInt(id, 10);
    if (isNaN(configId)) {
      return NextResponse.json({ error: "Invalid configuration ID" }, { status: 400 });
    }
    
    // Get the plugin configuration
    const pluginConfig = await pluginDb.getPluginConfigById(configId);
    if (!pluginConfig) {
      return NextResponse.json({ error: "Plugin configuration not found" }, { status: 404 });
    }
    
    // Verify the user owns this configuration
    if (pluginConfig.user_id !== userId) {
      return NextResponse.json({ 
        error: "You don't have permission to access this configuration" 
      }, { status: 403 });
    }
    
    // Get the plugin from the registry
    const plugin = pluginRegistry.getPlugin(pluginConfig.plugin_id);
    if (!plugin) {
      return NextResponse.json({ 
        error: "Plugin not found in registry, but configuration exists" 
      }, { status: 500 });
    }
    
    // Parse the configuration JSON
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(pluginConfig.config);
    } catch (error) {
      console.error("Error parsing plugin configuration JSON:", error);
      parsedConfig = {};
    }
    
    return NextResponse.json({
      id: pluginConfig.id,
      pluginId: pluginConfig.plugin_id,
      agentId: pluginConfig.agent_id,
      platform: pluginConfig.platform,
      config: parsedConfig,
      enabled: pluginConfig.enabled,
      createdAt: pluginConfig.created_at,
      updatedAt: pluginConfig.updated_at,
      plugin: {
        id: plugin.id,
        name: plugin.name,
        platform: plugin.platform,
        version: plugin.version,
        configSchema: plugin.configSchema
      }
    });
  } catch (error) {
    console.error("Error fetching plugin configuration:", error);
    return NextResponse.json({ error: "Failed to fetch plugin configuration" }, { status: 500 });
  }
}

// PUT /api/plugins/:id - Update a specific plugin configuration
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
    const id = extractIdFromUrl(req);
    const configId = parseInt(id, 10);
    if (isNaN(configId)) {
      return NextResponse.json({ error: "Invalid configuration ID" }, { status: 400 });
    }
    
    // Get the existing configuration
    const existingConfig = await pluginDb.getPluginConfigById(configId);
    if (!existingConfig) {
      return NextResponse.json({ error: "Plugin configuration not found" }, { status: 404 });
    }
    
    // Verify the user owns this configuration
    if (existingConfig.user_id !== userId) {
      return NextResponse.json({ 
        error: "You don't have permission to modify this configuration" 
      }, { status: 403 });
    }
    
    // Get request body
    const body = await req.json();
    
    // Update fields
    const updates: any = {};
    
    if (body.config !== undefined) {
      // Get the plugin to validate the configuration
      const plugin = pluginRegistry.getPlugin(existingConfig.plugin_id);
      if (!plugin) {
        return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
      }
      
      // Validate the new configuration
      const validationResult = await plugin.validateConfig(body.config);
      if (!validationResult.valid) {
        return NextResponse.json({ 
          error: "Invalid plugin configuration", 
          validationErrors: validationResult.errors 
        }, { status: 400 });
      }
      
      updates.config = JSON.stringify(body.config);
    }
    
    if (body.enabled !== undefined) {
      updates.enabled = body.enabled;
    }
    
    // Update the configuration
    const updatedConfig = await pluginDb.updatePluginConfig(configId, updates);
    if (!updatedConfig) {
      return NextResponse.json({ error: "Failed to update plugin configuration" }, { status: 500 });
    }
    
    // Parse the updated configuration JSON
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(updatedConfig.config);
    } catch (error) {
      console.error("Error parsing updated plugin configuration JSON:", error);
      parsedConfig = {};
    }
    
    return NextResponse.json({
      id: updatedConfig.id,
      pluginId: updatedConfig.plugin_id,
      agentId: updatedConfig.agent_id,
      platform: updatedConfig.platform,
      config: parsedConfig,
      enabled: updatedConfig.enabled,
      createdAt: updatedConfig.created_at,
      updatedAt: updatedConfig.updated_at
    });
  } catch (error) {
    console.error("Error updating plugin configuration:", error);
    return NextResponse.json({ error: "Failed to update plugin configuration" }, { status: 500 });
  }
}

// DELETE /api/plugins/:id - Delete a specific plugin configuration
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
    const id = extractIdFromUrl(req);
    const configId = parseInt(id, 10);
    if (isNaN(configId)) {
      return NextResponse.json({ error: "Invalid configuration ID" }, { status: 400 });
    }
    
    // Get the existing configuration
    const existingConfig = await pluginDb.getPluginConfigById(configId);
    if (!existingConfig) {
      return NextResponse.json({ error: "Plugin configuration not found" }, { status: 404 });
    }
    
    // Verify the user owns this configuration
    if (existingConfig.user_id !== userId) {
      return NextResponse.json({ 
        error: "You don't have permission to delete this configuration" 
      }, { status: 403 });
    }
    
    // Delete the configuration
    const deleted = await pluginDb.deletePluginConfig(configId);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete plugin configuration" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plugin configuration:", error);
    return NextResponse.json({ error: "Failed to delete plugin configuration" }, { status: 500 });
  }
}
