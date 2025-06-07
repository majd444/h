import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(_req: NextRequest) {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('google_calendar_token');
    
    if (!tokenCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated with Google Calendar' }, { status: 401 });
    }
    
    // No need to validate the token further since we're using mock data
    console.log('🔄 Using mock calendar data for development');
    
    // Create mock calendar data instead of making a real API call
    const mockCalendars = [
      {
        id: 'primary@example.com',
        summary: 'My Calendar',
        description: 'Your primary calendar',
        primary: true,
        backgroundColor: '#4285F4' // Google Blue
      },
      {
        id: 'work@example.com',
        summary: 'Work Schedule',
        description: 'Calendar for work events',
        primary: false,
        backgroundColor: '#0B8043' // Green
      },
      {
        id: 'personal@example.com',
        summary: 'Personal Events',
        description: 'Calendar for personal events',
        primary: false,
        backgroundColor: '#D50000' // Red
      },
      {
        id: 'travel@example.com',
        summary: 'Travel Plans',
        description: 'Calendar for travel plans and itineraries',
        primary: false,
        backgroundColor: '#F4511E' // Orange
      },
      {
        id: 'birthdays@example.com',
        summary: 'Birthdays',
        description: 'Birthday calendar',
        primary: false,
        backgroundColor: '#8E24AA' // Purple
      }
    ];
    
    return NextResponse.json({ calendars: mockCalendars });
  } catch (error: any) {
    console.error('Error generating mock calendars:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate mock calendars' },
      { status: 500 }
    );
  }
}
