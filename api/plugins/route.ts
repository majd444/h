/**
 * API Routes for Plugin Management
 * 
 * This module provides API endpoints for managing chatbot plugins
 * including listing, configuring, and enabling/disabling plugins.
 */
import { NextRequest, NextResponse } from "next/server";
import { pluginRegistry } from "@/lib/plugins/plugin-interface";
import { pluginDb } from "@/lib/database/plugin-db";
import { getAuthenticatedUserId, requireAuth } from "@/lib/auth-utils";

// GET /api/plugins - List all available plugins
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
    
    // Get query parameters
    const url = new URL(req.url);
    const agentId = url.searchParams.get("agentId");
    const platform = url.searchParams.get("platform");
    
    // Get all available plugins
    const availablePlugins = pluginRegistry.getAllPlugins().map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      platform: plugin.platform,
      version: plugin.version,
      configSchema: plugin.configSchema
    }));
    
    // Filter by platform if specified
    const filteredPlugins = platform 
      ? availablePlugins.filter(plugin => plugin.platform === platform)
      : availablePlugins;
    
    // Get user's plugin configurations
    const userConfigs = await pluginDb.getPluginConfigs(
      userId,
      agentId ? parseInt(agentId, 10) : undefined
    );
    
    // Merge plugin information with user configurations
    const plugins = filteredPlugins.map(plugin => {
      const userConfig = userConfigs.find(config => 
        config.plugin_id === plugin.id && 
        (!agentId || config.agent_id === parseInt(agentId, 10))
      );
      
      return {
        ...plugin,
        configured: !!userConfig,
        enabled: userConfig?.enabled || false,
        configId: userConfig?.id
      };
    });
    
    return NextResponse.json({ plugins });
  } catch (error) {
    console.error("Error fetching plugins:", error);
    return NextResponse.json({ error: "Failed to fetch plugins" }, { status: 500 });
  }
}

// POST /api/plugins - Configure a plugin
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
    
    // Get request body
    const body = await req.json();
    const { pluginId, agentId, config } = body;
    
    if (!pluginId || !agentId || !config) {
      return NextResponse.json({ 
        error: "Missing required fields: pluginId, agentId, and config are required" 
      }, { status: 400 });
    }
    
    // Get the plugin from the registry
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (!plugin) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
    }
    
    // Validate the configuration
    const validationResult = await plugin.validateConfig(config);
    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: "Invalid plugin configuration", 
        validationErrors: validationResult.errors 
      }, { status: 400 });
    }
    
    // Check if a configuration already exists
    const existingConfig = await pluginDb.getPluginConfigByPluginId(pluginId, userId, agentId);
    
    let pluginConfig;
    if (existingConfig) {
      // Update existing configuration
      pluginConfig = await pluginDb.updatePluginConfig(existingConfig.id, {
        config: JSON.stringify(config),
        enabled: body.enabled !== undefined ? body.enabled : existingConfig.enabled
      });
    } else {
      // Create new configuration
      pluginConfig = await pluginDb.createPluginConfig({
        plugin_id: pluginId,
        user_id: userId,
        agent_id: agentId,
        platform: plugin.platform,
        config: JSON.stringify(config),
        enabled: body.enabled !== undefined ? body.enabled : false
      });
    }
    
    if (!pluginConfig) {
      return NextResponse.json({ error: "Failed to save plugin configuration" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      configId: pluginConfig.id,
      pluginId: pluginConfig.plugin_id,
      agentId: pluginConfig.agent_id,
      enabled: pluginConfig.enabled
    });
  } catch (error) {
    console.error("Error configuring plugin:", error);
    return NextResponse.json({ error: "Failed to configure plugin" }, { status: 500 });
  }
}

// PUT /api/plugins - Update plugin configuration or status
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
    
    // Get request body
    const body = await req.json();
    const { configId } = body;
    
    if (!configId) {
      return NextResponse.json({ error: "Missing required field: configId" }, { status: 400 });
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
    
    return NextResponse.json({ 
      success: true,
      configId: updatedConfig.id,
      pluginId: updatedConfig.plugin_id,
      agentId: updatedConfig.agent_id,
      enabled: updatedConfig.enabled
    });
  } catch (error) {
    console.error("Error updating plugin configuration:", error);
    return NextResponse.json({ error: "Failed to update plugin configuration" }, { status: 500 });
  }
}
