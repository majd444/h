import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db-utils'; // We'll create this utility function

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, plan } = body;

    // Validate inputs
    if (!email || !plan) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create the user in the database
    const user = await createUser({
      email,
      name: name || email.split('@')[0],
      plan,
      status: 'active',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('User creation error:', error.message);
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating the user' },
      { status: 500 }
    );
  }
}
