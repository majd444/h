import { NextRequest, NextResponse } from "next/server";

// Structured logging function for better debugging
function logEvent(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    service: 'whatsapp-webhook',
    message,
    ...(data && { data })
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(logData));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logData));
  } else {
    console.log(JSON.stringify(logData));
  }
}

// Enhanced WhatsApp webhook implementation with better error handling
export async function GET(req: NextRequest) {
  try {
    // WhatsApp verification endpoint - needs to return the challenge
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Log verification attempt
    logEvent('info', 'WhatsApp webhook verification attempt', { mode });

    // Validate required parameters
    if (!mode || !token || !challenge) {
      logEvent('warn', 'WhatsApp verification missing parameters', { mode, hasToken: !!token, hasChallenge: !!challenge });
      return NextResponse.json(
        { error: "Missing required parameters" }, 
        { status: 400 }
      );
    }

    // For testing, we'll return the challenge if the verify token is correct
    // In production, you would verify against a stored token from a secure source
    if (mode === "subscribe" && token) {
      // Here you would validate the token against a stored secret
      // const isValidToken = token === process.env.WHATSAPP_VERIFY_TOKEN;
      const isValidToken = true; // For demonstration purposes

      if (isValidToken) {
        logEvent('info', 'WhatsApp webhook verified successfully');
        return new Response(challenge);
      }
    }

    logEvent('warn', 'WhatsApp verification failed', { mode });
    return NextResponse.json(
      { error: "Verification failed", details: "Invalid verification token" }, 
      { status: 403 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    
    logEvent('error', 'Error in WhatsApp webhook verification', { errorMessage, stack });
    
    return NextResponse.json(
      { error: "Internal server error", message: "Unable to process verification request" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      logEvent('warn', 'Invalid content type received', { contentType });
      return NextResponse.json(
        { error: "Invalid content type", message: "Expected application/json" },
        { status: 400 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      logEvent('error', 'Failed to parse request body', { error: String(parseError) });
      return NextResponse.json(
        { error: "Invalid request body", message: "Could not parse JSON" },
        { status: 400 }
      );
    }
    
    // In a production environment, you would validate the request signature
    // This would prevent unauthorized requests and ensure the request is from Meta
    // const signature = req.headers.get('x-hub-signature-256');
    // const isValid = validateSignature(signature, await req.text(), process.env.WHATSAPP_APP_SECRET);
    // if (!isValid) {
    //   logEvent('warn', 'Invalid signature', { signature });
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    logEvent('info', 'Received WhatsApp webhook data', { objectType: body.object });

    // Process the message data
    if (body.object === "whatsapp_business_account") {
      if (body.entry && body.entry.length > 0) {
        const entry = body.entry[0];
        if (entry.changes && entry.changes.length > 0) {
          const change = entry.changes[0];
          const value = change.value;

          if (value.messages && value.messages.length > 0) {
            const message = value.messages[0];
            const from = message.from; // The WhatsApp ID of the user
            const messageId = message.id;
            const timestamp = message.timestamp;

            logEvent('info', 'Processing WhatsApp message', { from, messageId, timestamp, type: message.type });

            // Process different message types
            if (message.type === 'text') {
              const text = message.text.body;
              logEvent('info', 'Processing text message', { from, text: text.substring(0, 100) });
              
              // Here you would process the message with your chatbot
              // const response = await processWithChatbot(text, from);
              // await sendWhatsAppResponse(from, response);
            } else if (message.type === 'image') {
              logEvent('info', 'Received image message', { from });
              // Handle image message
            } else if (message.type === 'audio') {
              logEvent('info', 'Received audio message', { from });
              // Handle audio message
            } else {
              logEvent('info', 'Received other message type', { from, type: message.type });
              // Handle other message types
            }
          }
        }
      }
    }

    // WhatsApp API requires a 200 OK response quickly
    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    
    logEvent('error', 'Error processing WhatsApp webhook', { errorMessage, stack });
    
    return NextResponse.json(
      { error: "Internal server error", message: "Unable to process webhook request" },
      { status: 500 }
    );
  }
}
