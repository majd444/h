/**
 * Authentication utilities for API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { accountDb } from './database/account-db';

/**
 * Get the authenticated user ID from cookies or request headers
 * @param req Next.js request object
 * @returns User ID or null if not authenticated
 */
export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  try {
    // Check for development mode query parameter
    const url = new URL(req.url);
    const devUserId = url.searchParams.get('userId');
    if (devUserId && process.env.NODE_ENV !== 'production') {
      console.log('Using development user ID from query:', devUserId);
      return devUserId;
    }
    
    // First try to get user ID from cookies
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id');
    const auth0IdCookie = cookieStore.get('auth0_id');
    
    // Prioritize Auth0 ID if available
    if (auth0IdCookie?.value) {
      return auth0IdCookie.value;
    }
    
    if (userIdCookie?.value) {
      return userIdCookie.value;
    }
    
    // If no cookie, try to get from authorization header (for API clients)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Extract user ID from JWT token
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          // Store the Auth0 ID in a cookie for future requests
          cookieStore.set('auth0_id', payload.sub, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
          });
          return payload.sub;
        }
        return null;
      } catch (e) {
        console.error('Failed to parse token:', e);
        return null;
      }
    }
    
    // For development only - allow a default user
    if (process.env.NODE_ENV !== 'production') {
      return 'default-user';
    }
    
    return null;
  } catch (error) {
    console.error('Error getting authenticated user ID:', error);
    return null;
  }
}

/**
 * Middleware to require authentication for API routes
 * @param req Next.js request object
 * @returns Response object or null if authenticated
 */
export async function requireAuth(req: NextRequest): Promise<NextResponse | null> {
  const userId = await getAuthenticatedUserId(req);
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check if the user exists in the database
  try {
    let account = await accountDb.getAccountByUserId(userId);
    
    // If no account exists, create one automatically
    if (!account) {
      console.log(`Creating new account for user ID: ${userId}`);
      
      // Get email from Auth0 token if available
      let email = `${userId}@example.com`; // Default fallback
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.email) {
            email = payload.email;
          }
        } catch (e) {
          console.error('Failed to extract email from token:', e);
        }
      }
      
      const newAccount = {
        accountId: `acc_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`,
        userId: userId,
        email: email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        profile: {
          name: email.split('@')[0],
          subscriptionPlan: 'FREE'
        }
      };
      
      account = await accountDb.createAccount(newAccount);
      console.log(`Created new account: ${account.accountId} for user: ${userId}`);
    } else {
      // Update last login time
      account.lastLogin = new Date().toISOString();
      await accountDb.updateAccount(account);
    }
    
    return null; // Allow the request to proceed
  } catch (error) {
    console.error('Error checking/creating user account:', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}

/**
 * Get the account for the authenticated user
 * @param req Next.js request object
 * @returns Account object or null if not authenticated
 */
export async function getAuthenticatedAccount(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  
  if (!userId) {
    return null;
  }
  
  return accountDb.getAccountByUserId(userId);
}
