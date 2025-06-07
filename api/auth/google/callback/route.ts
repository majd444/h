import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ensureAccountExists } from '@/lib/account-utils';

// This is a mock implementation for development purposes
// In production, this would use real OAuth credentials
const MOCK_REDIRECT_URI = 'http://localhost:3001/auth/google/callback';

// GET handler for OAuth callback
export async function GET(request: NextRequest) {
  console.log('🔍 Mock Google OAuth Callback - Started');
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  
  console.log('📝 Received parameters:', { 
    codeExists: !!code, 
    stateExists: !!stateParam 
  });
  
  if (!stateParam) {
    console.error('❌ Missing required state parameter');
    return NextResponse.redirect(new URL('/?auth=error&reason=missing_state', request.nextUrl.origin));
  }
  
  try {    
    // Mock token data - in a real app, this would come from Google after token exchange
    const mockTokenData = {
      access_token: 'mock_access_token_' + Math.random().toString(36).substring(2),
      refresh_token: 'mock_refresh_token_' + Math.random().toString(36).substring(2),
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'email profile',
    };
    
    console.log('✅ Successfully generated mock token response');
    
    // Parse the state to get component ID and service
    let service: string = 'default';
    let componentId: string = 'default';
    try {
      const decodedState = JSON.parse(Buffer.from(stateParam, 'base64').toString());
      service = decodedState.service || 'default';
      componentId = decodedState.componentId || 'default';
      console.log('🧩 Decoded state:', { service, componentId });
    } catch (error) {
      console.error('❌ Failed to decode state:', error);
      // Default values already set
    }
    
    // For debugging only: log token info
    console.log('💾 Storing mock token for service:', service);
    console.log('📅 Mock token expires in:', mockTokenData.expires_in, 'seconds');
    
    // Store tokens in cookie
    // Using new Next.js cookies API
    const mockUserId = `mock-user-${Date.now()}`;
    
    // Mock user information that would normally come from Auth0 userinfo endpoint
    const mockUserInfo = {
      sub: `google-oauth2|${mockUserId}`,
      given_name: 'John',
      family_name: 'Doe',
      nickname: 'johndoe',
      name: 'John Doe',
      picture: 'https://lh3.googleusercontent.com/a/mock-picture',
      updated_at: new Date().toISOString(),
      email: 'john.doe@example.com',
      email_verified: true
    };
    
    // Get cookies object and await it before using set method
    const cookiesStore = await cookies();
    
    cookiesStore.set({
      name: `google_${service}_token`,
      value: JSON.stringify({
        access_token: mockTokenData.access_token,
        refresh_token: mockTokenData.refresh_token,
        expiry: Date.now() + (mockTokenData.expires_in || 3600) * 1000,
        token_type: mockTokenData.token_type || 'Bearer',
        scope: mockTokenData.scope || '',
      }),
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Also set user ID cookie to simulate an authenticated user
    cookiesStore.set({
      name: 'user_id',
      value: mockUserId,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Store user info in cookie
    cookiesStore.set({
      name: 'user_info',
      value: JSON.stringify(mockUserInfo),
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Create or retrieve account ID for this user
    // Use Auth0 user ID (sub) to ensure consistent account IDs across logins
    const account = await ensureAccountExists(mockUserInfo.sub, mockUserInfo.email);
    
    console.log(`🔑 Auth0 user ${mockUserInfo.sub} linked to account ID ${account.accountId}`);
    
    // Store account ID in cookie
    cookiesStore.set({
      name: 'account_id',
      value: account.accountId,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    console.log(`✅ Mock token and account ID ${account.accountId} successfully stored in cookie`);
    
    // Check if the user already has completed payment
    const hasPaidCookie = cookiesStore.get('payment_completed');
    const hasCompletedPayment = hasPaidCookie?.value === 'true';
    
    // Set auth0 access token cookie (for middleware auth check)
    cookiesStore.set({
      name: 'auth0.access_token',
      value: mockTokenData.access_token,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Store login status in a cookie that is accessible by client-side code
    cookiesStore.set({
      name: 'is_authenticated',
      value: 'true',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Check if there's a return path saved in the query params
    const returnPath = searchParams.get('return_path');
    
    // Determine final redirect destination
    let redirectDestination = '/payment'; // Default for new users
    
    // If user has completed payment, direct to home
    if (hasCompletedPayment) {
      redirectDestination = '/home';
    }
    // If returnPath is specified, respect that
    else if (returnPath) {
      redirectDestination = returnPath;
    }
    
    // Always redirect through auth-sync page to ensure client-side auth state is synchronized
    // This helps prevent the issue where users get stuck on landing page
    return NextResponse.redirect(
      new URL(
        `/auth-sync?auth=true&redirect=${encodeURIComponent(redirectDestination)}${hasCompletedPayment ? '&payment=true' : ''}`, 
        request.nextUrl.origin
      )
    );
  } catch (error) {
    console.error('Mock OAuth callback error:', error);
    // Redirect with error
    return NextResponse.redirect(new URL('/?auth=error', request.nextUrl.origin));
  }
}

// POST handler with mock implementation (for programmatic auth)  
export async function POST(request: NextRequest) {
  console.log('🔍 Mock Google OAuth Callback POST - Started');
  
  // Parse request body
  let body;
  try {
    body = await request.json();
    console.log('📝 Received POST parameters:', { 
      codeExists: !!body.code, 
      stateExists: !!body.state
    });
  } catch (error) {
    console.error('❌ Failed to parse request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  
  // Use underscore prefix to mark code as unused since we're mocking
  const { code: _code, state } = body;
  
  if (!state) {
    console.error('❌ Missing required state parameter in POST body');
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }
  
  console.log('🔄 Using mock redirect URI:', MOCK_REDIRECT_URI);
  
  try {
    // Mock token data - simulates a response from Google's token endpoint
    const mockTokenData = {
      access_token: 'mock_post_access_token_' + Math.random().toString(36).substring(2),
      refresh_token: 'mock_post_refresh_token_' + Math.random().toString(36).substring(2),
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'email profile',
      id_token: 'mock.jwt.token', // Mock ID token (would be a JWT in real implementation)
    };
    
    console.log('✅ POST: Successfully generated mock token response');
    
    // Parse the state to get component ID and service
    let service: string = 'default';
    let componentId: string = 'default';
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
      service = decodedState.service || 'default';
      componentId = decodedState.componentId || 'default';
      console.log('🧩 POST: Decoded state:', { service, componentId });
    } catch (error) {
      console.error('❌ POST: Failed to decode state:', error);
      // Default values already set
    }
    
    // Generate a mock user ID
    const mockUserId = `mock-user-${Date.now()}`;
    
    // Mock user information that would normally come from Auth0 userinfo endpoint
    const mockUserInfo = {
      sub: `google-oauth2|${mockUserId}`,
      given_name: 'John',
      family_name: 'Doe',
      nickname: 'johndoe',
      name: 'John Doe',
      picture: 'https://lh3.googleusercontent.com/a/mock-picture',
      updated_at: new Date().toISOString(),
      email: 'john.doe@example.com',
      email_verified: true
    };
    
    // Store tokens in cookies using new Next.js cookies API
    // Get cookies object and await it before using set method
    const cookiesStore = await cookies();
    
    cookiesStore.set({
      name: `google_${service}_token`,
      value: JSON.stringify({
        access_token: mockTokenData.access_token,
        refresh_token: mockTokenData.refresh_token,
        expiry: Date.now() + (mockTokenData.expires_in || 3600) * 1000,
        token_type: mockTokenData.token_type || 'Bearer',
        scope: mockTokenData.scope || '',
        id_token: mockTokenData.id_token
      }),
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Also set user ID cookie to simulate an authenticated user
    cookiesStore.set({
      name: 'user_id',
      value: mockUserId,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Set auth0 access token cookie (for middleware auth check)
    cookiesStore.set({
      name: 'auth0.access_token',
      value: mockTokenData.access_token,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Store login status in a cookie that is accessible by client-side code
    cookiesStore.set({
      name: 'is_authenticated',
      value: 'true',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Store user info in cookie
    cookiesStore.set({
      name: 'user_info',
      value: JSON.stringify(mockUserInfo),
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Create or retrieve account ID for this user
    // Use Auth0 user ID (sub) to ensure consistent account IDs across logins
    const account = await ensureAccountExists(mockUserInfo.sub, mockUserInfo.email);
    
    console.log(`🔑 Auth0 user ${mockUserInfo.sub} linked to account ID ${account.accountId}`);
    
    // Store account ID in cookie
    cookiesStore.set({
      name: 'account_id',
      value: account.accountId,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Check if the user already has completed payment
    const hasPaidCookie = cookiesStore.get('payment_completed');
    const hasCompletedPayment = hasPaidCookie?.value === 'true';
    
    // Include redirection information in response
    const redirectTo = hasCompletedPayment ? '/home' : '/payment';
    
    // Return success response with token info, user info, and redirect info
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      service,
      componentId,
      user_id: mockUserId,
      user_info: mockUserInfo,
      token_type: mockTokenData.token_type,
      expires_in: mockTokenData.expires_in,
      redirect: redirectTo,
      hasCompletedPayment
    });
  } catch (error) {
    console.error('POST: Mock OAuth callback error:', error);
    return NextResponse.json({ 
      error: 'OAuth callback failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
