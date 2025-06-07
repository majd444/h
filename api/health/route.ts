/**
 * Health check endpoint for monitoring server status
 */
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check database connection
    const dbStatus = 'connected'; // In a real implementation, you would check the actual connection
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
