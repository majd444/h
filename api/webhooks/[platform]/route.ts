/**
 * Webhook Handler for External Platform Integrations
 * 
 * This module provides webhook endpoints for receiving messages and events
 * from external platforms like WordPress, WhatsApp, etc.
 */
import { NextRequest, NextResponse } from "next/server";
import { pluginRegistry } from "@/lib/plugins/plugin-interface";
import { pluginDb } from "@/lib/database/plugin-db";
import { agentDb } from "@/lib/database/agent-db";

// Helper function to extract platform from URL path
function extractPlatformFromUrl(req: NextRequest): string {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  return pathParts[pathParts.length - 1];
}

// POST /api/webhooks/:platform - Handle webhook events from external platforms
export async function POST(req: NextRequest) {
  try {
    const platform = extractPlatformFromUrl(req);
    if (!platform) {
      return NextResponse.json({ error: "Platform not specified" }, { status: 400 });
    }
    
    // Get the payload
    const payload = await req.json();
    
    // Get all plugins for this platform
    const plugins = pluginRegistry.getPluginsByPlatform(platform);
    if (plugins.length === 0) {
      return NextResponse.json({ error: `No plugins found for platform: ${platform}` }, { status: 404 });
    }
    
    // Process the webhook with each plugin
    for (const plugin of plugins) {
      try {
        // Handle the webhook
        const message = await plugin.handleWebhook({
          ...payload,
          platform
        });
        
        if (message) {
          console.log(`Received message from ${platform}:`, message);
          
          // Here you would typically:
          // 1. Find the agent associated with this integration
          // 2. Process the message with the agent
          // 3. Send a response back to the user
          
          // For now, we'll just acknowledge receipt
          return NextResponse.json({
            success: true,
            message: "Webhook processed successfully",
            platform
          });
        }
      } catch (error) {
        console.error(`Error processing webhook with plugin for ${platform}:`, error);
      }
    }
    
    // If no plugin handled the webhook or no message was returned
    return NextResponse.json({
      success: true,
      message: "Webhook received but no handler found",
      platform
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}

// GET /api/webhooks/:platform - Handle verification requests from external platforms
export async function GET(req: NextRequest) {
  try {
    const platform = extractPlatformFromUrl(req);
    if (!platform) {
      return NextResponse.json({ error: "Platform not specified" }, { status: 400 });
    }
    
    // Get URL parameters
    const searchParams = req.nextUrl.searchParams;
    
    // Get all plugins for this platform
    const plugins = pluginRegistry.getPluginsByPlatform(platform);
    if (plugins.length === 0) {
      return NextResponse.json({ error: `No plugins found for platform: ${platform}` }, { status: 404 });
    }
    
    // Try each plugin for verification
    for (const plugin of plugins) {
      try {
        if (plugin.verifyWebhook) {
          const verificationResponse = await plugin.verifyWebhook({
            searchParams,
            platform
          });
          
          if (verificationResponse) {
            // If the plugin handled the verification, return its response
            if (typeof verificationResponse === 'string') {
              // Plain text response
              return new NextResponse(verificationResponse, {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            } else {
              // JSON response
              return NextResponse.json(verificationResponse);
            }
          }
        }
      } catch (error) {
        console.error(`Error verifying webhook with plugin for ${platform}:`, error);
      }
    }
    
    // If no plugin handled the verification
    return NextResponse.json({
      success: false,
      message: "No verification handler found for this platform",
      platform
    }, { status: 400 });
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return NextResponse.json({ error: "Failed to verify webhook" }, { status: 500 });
  }
}
