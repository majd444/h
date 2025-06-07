import { NextResponse } from 'next/server';
import contentExtractorService from '@/lib/services/content-extractor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Use the content extractor to get links and content from the URL
    const extractedContent = await contentExtractorService.extractFromUrl(url);
    
    // Return detailed information about the extracted content
    return NextResponse.json({ 
      success: true,
      links: extractedContent.links,
      title: extractedContent.title,
      description: extractedContent.description,
      content: extractedContent.content,
      url: url,
      extractedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in extract-links API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
