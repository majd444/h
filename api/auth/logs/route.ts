import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth0Logs, getAuth0UserLogs } from '@/lib/auth0-utils';

/**
 * GET endpoint to retrieve Auth0 logs
 * Can be filtered by userId or get all logs
 */
export async function GET(request: NextRequest) {
  try {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '0', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    
    let logs;
    
    if (userId) {
      // Get logs for a specific user
      logs = await getAuth0UserLogs(userId, page, perPage);
      console.log(`Retrieved ${logs.logs.length} Auth0 logs for user ${userId}`);
    } else {
      // Get all logs
      logs = await getAuth0Logs(page, perPage);
      console.log(`Retrieved ${logs.logs.length} Auth0 logs`);
    }
    
    // Log the Auth0 logs to the terminal
    console.log('Auth0 Logs:');
    console.log('===========');
    logs.logs.forEach((log: any, index: number) => {
      console.log(`[${index + 1}] ${new Date(log.date).toLocaleString()} - ${log.type} - ${log.description}`);
      if (log.user_id) {
        console.log(`    User: ${log.user_id}`);
      }
      if (log.ip) {
        console.log(`    IP: ${log.ip}`);
      }
      console.log('---');
    });
    console.log(`Total logs: ${logs.total}, Showing: ${logs.length}, Page: ${page + 1}`);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error retrieving Auth0 logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Auth0 logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
