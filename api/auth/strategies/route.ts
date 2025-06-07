import { NextRequest, NextResponse } from 'next/server';
import { getEnabledAuthStrategies } from '@/lib/auth/auth-strategies';

/**
 * GET endpoint to retrieve available authentication strategies
 */
export async function GET(_request: NextRequest) {
  try {
    // Get all enabled authentication strategies
    const strategies = getEnabledAuthStrategies();
    
    // Return the list of available strategies
    return NextResponse.json({
      strategies: strategies.map(strategy => ({
        name: strategy.name,
        displayName: strategy.displayName,
        icon: strategy.icon,
        callbackPath: strategy.callbackPath
      }))
    });
  } catch (error: any) {
    console.error('Error retrieving authentication strategies:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while retrieving authentication strategies' },
      { status: 500 }
    );
  }
}
