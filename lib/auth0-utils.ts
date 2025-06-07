import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'your-tenant.auth0.com';
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || 'your-client-id';
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET || 'your-client-secret';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || `https://${AUTH0_DOMAIN}/api/v2/`;

// Check if we're in development mode
const IS_DEV = process.env.NODE_ENV !== 'production';

// Flag to control whether to attempt real Auth0 API calls in development
// Set to false to always use mock data in development
const USE_REAL_AUTH0_IN_DEV = false;

/**
 * Get Auth0 Management API token
 */
export async function getAuth0ManagementToken(): Promise<string> {
  // In development mode with USE_REAL_AUTH0_IN_DEV=false, return a mock token
  if (IS_DEV && !USE_REAL_AUTH0_IN_DEV) {
    console.log('🔑 Using mock Auth0 management token in development mode');
    return 'mock-auth0-management-token';
  }
  
  try {
    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        audience: AUTH0_AUDIENCE
      })
    });

    if (!response.ok) {
      if (IS_DEV) {
        console.warn(`⚠️ Auth0 API returned ${response.status}. Using mock token instead.`);
        return 'mock-auth0-management-token-after-api-error';
      }
      throw new Error(`Failed to get Auth0 management token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Auth0 management token:', error);
    
    if (IS_DEV) {
      console.warn('⚠️ Using mock Auth0 management token after error');
      return 'mock-auth0-management-token-after-error';
    }
    
    throw error;
  }
}

/**
 * Generate mock user data for development
 */
function generateMockUserData(userId: string): any {
  // Extract a clean user ID from formats like "google-oauth2|123456"
  const cleanUserId = userId.includes('|') ? userId.split('|')[1] : userId;
  
  return {
    user_id: userId,
    email: `user-${cleanUserId}@example.com`,
    email_verified: true,
    name: `Test User ${cleanUserId.substring(0, 6)}`,
    nickname: `user${cleanUserId.substring(0, 4)}`,
    picture: 'https://s.gravatar.com/avatar/default?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fjo.png',
    updated_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    last_login: new Date().toISOString(),
    logins_count: 5
  };
}

/**
 * Generate mock logs for development
 */
function generateMockUserLogs(userId: string, page: number = 0, perPage: number = 10): any {
  const mockLogs = Array(perPage).fill(0).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString(),
    type: i % 3 === 0 ? 's' : i % 3 === 1 ? 'ss' : 'f',
    description: `Mock log entry ${i + 1} for user ${userId}`,
    ip: '127.0.0.1',
    user_id: userId,
    log_id: `log_${uuidv4()}`
  }));
  
  return {
    logs: mockLogs,
    total: 100,
    start: page * perPage,
    limit: perPage,
    length: mockLogs.length
  };
}

/**
 * Generate mock logs for development (all users)
 */
function generateMockLogs(page: number = 0, perPage: number = 10): any {
  const mockLogs = Array(perPage).fill(0).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString(),
    type: i % 3 === 0 ? 's' : i % 3 === 1 ? 'ss' : 'f',
    description: `Mock log entry ${i + 1}`,
    ip: '127.0.0.1',
    user_id: `auth0|user${i + 1}`,
    log_id: `log_${uuidv4()}`
  }));
  
  return {
    logs: mockLogs,
    total: 100,
    start: page * perPage,
    limit: perPage,
    length: mockLogs.length
  };
}

/**
 * Get Auth0 user by ID
 */
export async function getAuth0UserById(userId: string): Promise<any> {
  // In development mode with USE_REAL_AUTH0_IN_DEV=false, return mock user data
  if (IS_DEV && !USE_REAL_AUTH0_IN_DEV) {
    console.log(`👤 Using mock Auth0 user data for ${userId} in development mode`);
    return generateMockUserData(userId);
  }
  
  try {
    const token = await getAuth0ManagementToken();
    
    const response = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (IS_DEV) {
        console.warn(`⚠️ Auth0 API returned ${response.status} for user ${userId}. Using mock user data instead.`);
        return generateMockUserData(userId);
      }
      throw new Error(`Failed to get Auth0 user: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user from Auth0:', error);
    
    if (IS_DEV) {
      console.warn(`⚠️ Using mock Auth0 user data for ${userId} after error`);
      return generateMockUserData(userId);
    }
    
    throw error;
  }
}

/**
 * Get Auth0 logs for a specific user
 */
export async function getAuth0UserLogs(userId: string, page: number = 0, perPage: number = 10): Promise<any> {
  // In development mode with USE_REAL_AUTH0_IN_DEV=false, return mock logs
  if (IS_DEV && !USE_REAL_AUTH0_IN_DEV) {
    console.log(`📝 Using mock Auth0 logs for user ${userId} in development mode`);
    return generateMockUserLogs(userId, page, perPage);
  }
  
  try {
    // Get management API token
    const token = await getAuth0ManagementToken();
    
    // Get logs for user from Auth0
    const response = await fetch(
      `https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}/logs?page=${page}&per_page=${perPage}&include_totals=true`, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (IS_DEV) {
        console.warn(`⚠️ Auth0 API returned ${response.status} for user logs. Using mock logs instead.`);
        return generateMockUserLogs(userId, page, perPage);
      }
      throw new Error(`Failed to get user logs from Auth0: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user logs from Auth0:', error);
    
    if (IS_DEV) {
      console.warn(`⚠️ Using mock Auth0 logs for user ${userId} after error`);
      return generateMockUserLogs(userId, page, perPage);
    }
    
    throw error;
  }
}

/**
 * Get all Auth0 logs with pagination
 */
export async function getAuth0Logs(page: number = 0, perPage: number = 10): Promise<any> {
  // In development mode with USE_REAL_AUTH0_IN_DEV=false, return mock logs
  if (IS_DEV && !USE_REAL_AUTH0_IN_DEV) {
    console.log('📝 Using mock Auth0 logs in development mode');
    return generateMockLogs(page, perPage);
  }
  
  try {
    // Get management API token
    const token = await getAuth0ManagementToken();
    
    // Get logs from Auth0
    const response = await fetch(
      `https://${AUTH0_DOMAIN}/api/v2/logs?page=${page}&per_page=${perPage}&include_totals=true`, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (IS_DEV) {
        console.warn(`⚠️ Auth0 API returned ${response.status} for logs. Using mock logs instead.`);
        return generateMockLogs(page, perPage);
      }
      throw new Error(`Failed to get logs from Auth0: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting logs from Auth0:', error);
    
    if (IS_DEV) {
      console.warn('⚠️ Using mock Auth0 logs after error');
      return generateMockLogs(page, perPage);
    }
    
    throw error;
  }
}

/**
 * Generate a consistent account ID from Auth0 user ID
 * This ensures the same user always gets the same account ID
 */
export function generateConsistentAccountId(auth0UserId: string): string {
  // If no Auth0 user ID is provided, fall back to a random UUID
  if (!auth0UserId) {
    console.warn('⚠️ No Auth0 user ID provided, generating random account ID');
    return `acc_${uuidv4()}`;
  }
  
  try {
    // Create a hash of the Auth0 user ID
    const hash = crypto.createHash('sha256').update(auth0UserId).digest('hex');
    
    // Use the first 32 characters of the hash to create a UUID-like format
    const uuidFormat = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      hash.substring(12, 16),
      hash.substring(16, 20),
      hash.substring(20, 32)
    ].join('-');
    
    // Prefix with 'acc_' to indicate this is an account ID
    return `acc_${uuidFormat}`;
  } catch (error) {
    console.error('Error generating consistent account ID:', error);
    // Fall back to a random UUID if there's an error
    return `acc_${uuidv4()}`;
  }
}
