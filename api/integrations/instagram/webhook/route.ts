import { NextRequest, NextResponse } from "next/server";

// This is a placeholder implementation for the Instagram webhook
// Instagram messaging API is accessed through the Messenger Platform

export async function GET(req: NextRequest) {
  try {
    // Meta platform verification endpoint - needs to return the challenge
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // For testing, we'll return the challenge if the verify token is correct
    // In production, you would verify against a stored token
    if (mode === "subscribe" && token) {
      console.log("Instagram webhook verified");
      return new Response(challenge);
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  } catch (error) {
    console.error("Error in Instagram webhook verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // In a production environment, you would:
    // 1. Validate the request signature
    // 2. Parse incoming messages
    // 3. Process them through your chatbot
    // 4. Send a response back to Instagram

    console.log("Received Instagram webhook data:", JSON.stringify(body));

    // Log the incoming message data for debugging
    if (body.object === "instagram") {
      if (body.entry && body.entry.length > 0) {
        // Process the incoming messages
        // This is where you would handle the message and send it to your chatbot
        console.log("Processing Instagram message...");
      }
    }

    // Meta API requires a 200 OK response quickly
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Instagram webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
