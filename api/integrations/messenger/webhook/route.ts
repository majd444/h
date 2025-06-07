import { NextRequest, NextResponse } from "next/server";

// This is a placeholder implementation for the Messenger webhook
// In a production environment, you would implement proper validation and message handling

export async function GET(req: NextRequest) {
  try {
    // Messenger verification endpoint - needs to return the challenge
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // For testing, we'll return the challenge if the verify token is correct
    // In production, you would verify against a stored token
    if (mode === "subscribe" && token) {
      console.log("Messenger webhook verified");
      return new Response(challenge);
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  } catch (error) {
    console.error("Error in Messenger webhook verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // In a production environment, you would:
    // 1. Validate the request signature using the app secret
    // 2. Parse incoming messages
    // 3. Process them through your chatbot
    // 4. Send a response back to Messenger

    console.log("Received Messenger webhook data:", JSON.stringify(body));

    // Log the incoming message data for debugging
    if (body.object === "page") {
      if (body.entry && body.entry.length > 0) {
        for (const entry of body.entry) {
          // Get the messaging events
          const messaging = entry.messaging;
          if (messaging && messaging.length > 0) {
            for (const event of messaging) {
              if (event.message) {
                const senderId = event.sender.id;
                const message = event.message.text;
                console.log(`Received message from ${senderId}: ${message}`);
                
                // Process the message and generate a response
                // This is where you would integrate with your chatbot
              }
            }
          }
        }
      }
    }

    // Messenger API requires a 200 OK response quickly
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Messenger webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
