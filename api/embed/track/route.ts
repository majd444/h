/**
 * Chatbot Event Tracking API Route
 * 
 * This route collects usage data from the embedded chatbot for analytics and billing.
 */
import { NextRequest, NextResponse } from "next/server";
import axios from 'axios';

// POST /api/embed/track - Track chatbot events
export async function POST(req: NextRequest) {
  try {
    const { event, data } = await req.json();
    
    if (!event || !data || !data.agentId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // Forward the event to our tracking server
    const trackingEndpoint = process.env.TRACKING_ENDPOINT || 'http://localhost:3001/api/track';
    const apiKey = process.env.DEFAULT_API_KEY;
    
    if (apiKey) {
      try {
        await axios.post(trackingEndpoint, {
          event,
          data
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          }
        });
      } catch (error) {
        console.error('Error forwarding tracking event:', error);
        // Don't fail the request if tracking fails
      }
    }
    
    // Return a success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in tracking API:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
