
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAccountByUserId, getAccountByEmail, getAllAccounts, getPaginatedAccounts } from '@/lib/account-utils';
import { accountDb } from '@/lib/database/account-db';

/**
 * GET endpoint to retrieve account information
 * Can be filtered by userId or email
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    
    // For development/debugging - get all accounts with pagination
    const getAll = searchParams.get('all') === 'true';
    const includeTotals = searchParams.get('include_totals') === 'true';
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    if (getAll) {
      if (includeTotals) {
        // Return with Auth0-style pagination format
        const paginatedResults = await getPaginatedAccounts(page, limit);
        return NextResponse.json(paginatedResults);
      } else {
        // Return simple array of accounts
        const accounts = await getAllAccounts();
        return NextResponse.json({ accounts });
      }
    }
    
    // Check if we have a userId or email to look up
    if (!userId && !email) {
      // Try to get userId from cookies
      const cookieStore = await cookies();
      const userIdCookie = cookieStore.get('user_id');
      
      if (!userIdCookie?.value) {
        return NextResponse.json(
          { error: 'Missing required parameters. Provide userId or email.' },
          { status: 400 }
        );
      }
      
      const account = await getAccountByUserId(userIdCookie.value);
      return NextResponse.json({ account });
    }
    
    // Look up by userId if provided
    if (userId) {
      const account = await getAccountByUserId(userId);
      if (!account) {
        return NextResponse.json(
          { error: 'Account not found for this user ID' },
          { status: 404 }
        );
      }
      return NextResponse.json({ account });
    }
    
    // Look up by email if provided
    if (email) {
      const account = await getAccountByEmail(email);
      if (!account) {
        return NextResponse.json(
          { error: 'Account not found for this email' },
          { status: 404 }
        );
      }
      return NextResponse.json({ account });
    }
    
    // This should never happen due to the checks above
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Account retrieval error:', error.message);
    return NextResponse.json(
      { error: error.message || 'An error occurred while retrieving account information' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to create or ensure an account exists
 * This is used during authentication to ensure each user has an account ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, name, picture } = body;
    
    // Validate inputs
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId. Auth0 sub ID is required.' },
        { status: 400 }
      );
    }
    
    // Use email from request or generate a placeholder
    const userEmail = email || `${userId}@example.com`;
    
    // Check if account already exists
    let account = await getAccountByUserId(userId);
    
    if (account) {
      // Update existing account with latest info
      account.lastLogin = new Date().toISOString();
      if (email && account.email !== email) account.email = email;
      if (name) account.name = name;
      if (picture) account.picture = picture;
      
      account = await accountDb.updateAccount(account);
      console.log(`Updated account for Auth0 user: ${userId}`);
    } else {
      // Create new account
      const newAccount = {
        accountId: `acc_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`,
        userId: userId,
        email: userEmail,
        name: name || userEmail.split('@')[0],
        picture: picture,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      account = await accountDb.createAccount(newAccount);
      console.log(`Created new account: ${account.accountId} for Auth0 user: ${userId}`);
    }
    
    // Store user ID and account ID in cookies for server-side access
    const cookieStore = await cookies();
    
    // Store user ID
    cookieStore.set({
      name: 'user_id',
      value: userId,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Store account ID
    cookieStore.set({
      name: 'account_id',
      value: account.accountId,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    return NextResponse.json({ 
      success: true, 
      account,
      message: `Account successfully ${account ? 'updated' : 'created'} for user ${userId}`
    });
  } catch (error: any) {
    console.error('Account creation/update error:', error.message);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing the account' },
      { status: 500 }
    );
  }
}
