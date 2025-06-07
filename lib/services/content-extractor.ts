/**
 * Content Extractor Service
 * 
 * This service extracts content, links, title, and description from URLs.
 */

import { JSDOM } from 'jsdom';

interface ExtractedContent {
  title: string;
  description: string;
  content: string;
  links: string[];
}

class ContentExtractorService {
  /**
   * Extract content from a URL
   * @param url The URL to extract content from
   * @returns Extracted content including title, description, and links
   */
  async extractFromUrl(url: string): Promise<ExtractedContent> {
  try {
    // Fetch the content from the URL
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Use JSDOM to parse the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Extract the title
    const title = document.querySelector('title')?.textContent || '';
    
    // Extract the description from meta tags
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                           document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    
    // Extract all links
    const linkElements = document.querySelectorAll('a[href]');
    const links: string[] = [];
    
    linkElements.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        // Convert relative URLs to absolute
        try {
          const absoluteUrl = new URL(href, url).href;
          links.push(absoluteUrl);
        } catch (error) {
          // Skip invalid URLs
          console.debug(`Skipping invalid URL: ${href}`, error);
        }
      }
    });
    
    // Extract the main content (simplified approach)
    const bodyContent = document.querySelector('body')?.textContent || '';
    const content = bodyContent.replace(/\\s+/g, ' ').trim();
    
    return {
      title,
      description: metaDescription,
      content,
      links: [...new Set(links)] // Remove duplicates
    };
    
  } catch (error) {
    console.error('Error extracting content from URL:', error);
    throw error;
  }
  }
}

// Create and export a singleton instance
const contentExtractorService = new ContentExtractorService();
export default contentExtractorService;
