import { NextResponse } from 'next/server';

export async function GET() {
  // Create a safe representation of environment variables for debugging
  // DO NOT expose the actual API key value
  const envStatus = {
    FALLBACK_MODE: process.env.FALLBACK_MODE,
    OPENROUTER_API_KEY_EXISTS: !!process.env.OPENROUTER_API_KEY,
    OPENROUTER_API_KEY_LENGTH: process.env.OPENROUTER_API_KEY?.length || 0,
    DEFAULT_MODEL: process.env.DEFAULT_MODEL,
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json(envStatus);
}
