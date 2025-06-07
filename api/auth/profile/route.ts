import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth0UserById } from '@/lib/auth0-utils';
import { updateUserProfile, getAccountByUserId, getAccountByEmail } from '@/lib/account-utils';

/**
 * GET endpoint to retrieve user profile information
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookies or query params
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id');
    const userId = userIdCookie?.value || request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get account information - try both userId and email fields
    let account = await getAccountByUserId(userId);
    
    // If not found by userId, try email field (accounts might be stored with swapped fields)
    if (!account) {
      account = await getAccountByEmail(userId);
    }
    
    if (!account) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return profile information
    return NextResponse.json({
      profile: {
        userId: account.userId,
        email: account.email,
        name: account.name,
        picture: account.picture,
        lastLogin: account.lastLogin,
        createdAt: account.createdAt,
        metadata: account.metadata || {}
      }
    });
  } catch (error: any) {
    console.error('Error retrieving user profile:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while retrieving user profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update user profile information
 */
export async function PUT(request: NextRequest) {
  try {
    // Get user ID from cookies or request body
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id');
    const body = await request.json();
    const userId = userIdCookie?.value || body.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Validate profile data
    const { name, picture, metadata } = body;
    const profileData: any = {};
    
    if (name) profileData.name = name;
    if (picture) profileData.picture = picture;
    if (metadata) profileData.metadata = { ...(await getAccountByUserId(userId))?.metadata, ...metadata };
    
    // Try to get the account first to ensure it exists
    let account = await getAccountByUserId(userId);
    
    // If not found by userId, try email field (accounts might be stored with swapped fields)
    if (!account) {
      account = await getAccountByEmail(userId);
    }
    
    if (!account) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update profile using the correct account ID
    const updatedProfile = await updateUserProfile(account.userId, profileData);
    
    // Return updated profile (TypeScript safety check already done above)
    return NextResponse.json({
      profile: {
        userId: updatedProfile.userId,
        email: updatedProfile.email,
        name: updatedProfile.name,
        picture: updatedProfile.picture,
        lastLogin: updatedProfile.lastLogin,
        createdAt: updatedProfile.createdAt,
        metadata: updatedProfile.metadata || {}
      }
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating user profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint to sync profile with Auth0
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get user ID from cookies or query params
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id');
    const userId = userIdCookie?.value || request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get Auth0 user information
    const auth0User = await getAuth0UserById(userId);
    
    if (!auth0User) {
      return NextResponse.json(
        { error: 'Auth0 user not found' },
        { status: 404 }
      );
    }
    
    // Try to get the account first to ensure it exists
    let account = await getAccountByUserId(userId);
    
    // If not found by userId, try email field (accounts might be stored with swapped fields)
    if (!account) {
      account = await getAccountByEmail(userId);
    }
    
    if (!account) {
      return NextResponse.json(
        { error: 'User not found in local database' },
        { status: 404 }
      );
    }
    
    // Update profile with Auth0 data
    const profileData = {
      name: auth0User.name,
      picture: auth0User.picture,
      metadata: {
        auth0_last_login: auth0User.last_login,
        auth0_logins_count: auth0User.logins_count,
        auth0_created_at: auth0User.created_at,
        auth0_updated_at: auth0User.updated_at
      }
    };
    
    // Update profile using the correct account ID
    const updatedProfile = await updateUserProfile(account.userId, profileData);
    
    // TypeScript safety check
    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }
    
    // Return updated profile
    return NextResponse.json({
      profile: {
        userId: updatedProfile.userId,
        email: updatedProfile.email,
        name: updatedProfile.name,
        picture: updatedProfile.picture,
        lastLogin: updatedProfile.lastLogin,
        createdAt: updatedProfile.createdAt,
        metadata: updatedProfile.metadata || {}
      },
      synced: true
    });
  } catch (error: any) {
    console.error('Error syncing user profile with Auth0:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while syncing user profile with Auth0' },
      { status: 500 }
    );
  }
}
