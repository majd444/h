import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Environment type check helper
const isDevelopment = () => process.env.NODE_ENV !== 'production';

// Auth0 userinfo endpoint
const AUTH0_USERINFO_URL = 'https://your-auth0-domain.auth0.com/userinfo';

/**
 * Retrieves user information from Auth0 using the access token
 * This endpoint should be called after successful authentication
 */
export async function GET(_request: NextRequest) {
  console.log('🔍 Auth0 UserInfo - Started');
  
  try {
    // Get the access token from cookies
    const cookieStore = cookies();
    const auth0TokenCookie = cookieStore.get('auth0.access_token');
    
    if (!auth0TokenCookie?.value) {
      console.error('❌ No access token found in cookies');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const accessToken = auth0TokenCookie.value;
    
    // In development mode with mock tokens, return mock user info
    if (isDevelopment() && accessToken.startsWith('mock_')) {
      console.log('⚠️ Using mock user info for development');
      
      // Generate mock user info
      const mockUserInfo = {
        sub: `auth0|${Date.now()}`,
        given_name: 'John',
        family_name: 'Doe',
        nickname: 'johndoe',
        name: 'John Doe',
        picture: 'https://cdn.auth0.com/avatars/jd.png',
        updated_at: new Date().toISOString(),
        email: 'john.doe@example.com',
        email_verified: true
      };
      
      // Store user info in a cookie for client access
      cookies().set({
        name: 'user_info',
        value: JSON.stringify(mockUserInfo),
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        secure: process.env.NODE_ENV === 'production'
      });
      
      return NextResponse.json(mockUserInfo);
    }
    
    // For production, make a real request to Auth0 userinfo endpoint
    const response = await fetch(AUTH0_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch user info from Auth0:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch user info', status: response.status }, 
        { status: response.status }
      );
    }
    
    const userInfo = await response.json();
    console.log(' Successfully retrieved user info from Auth0');
    
    // Store user info in a cookie for client access (non-sensitive parts only)
    const clientSafeUserInfo = {
      sub: userInfo.sub,
      name: userInfo.name,
      nickname: userInfo.nickname,
      picture: userInfo.picture,
      email: userInfo.email,
      email_verified: userInfo.email_verified
    };
    
    cookies().set({
      name: 'user_info',
      value: JSON.stringify(clientSafeUserInfo),
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production'
    });
    
    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('❌ Error fetching user info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user info', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
