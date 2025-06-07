/**
 * URL Security utilities
 * Provides security functions for safely handling redirects and URL operations
 */

/**
 * Safely redirect to a URL by checking if it's on the same origin
 * or is an absolute URL that we consider safe
 * 
 * @param url The URL to redirect to
 * @returns A safe URL to redirect to
 */
export function safeRedirect(url: string | URL): string {
  // If URL is not provided or is empty, default to index page
  if (!url || typeof url === 'undefined') {
    return '/'
  }

  // If url is already a URL object, get its href
  const urlStr = typeof url === 'string' ? url : url.href;
  
  // If the URL is relative (doesn't start with http:// or https://)
  if (!urlStr.startsWith('http')) {
    // Make sure it starts with a slash for proper routing
    if (!urlStr.startsWith('/')) {
      return `/${urlStr}`
    }
    return urlStr;
  }

  // For absolute URLs, check if they are pointing to our own domain
  try {
    // Parse the URL to check its components
    const parsedUrl = new URL(urlStr);
    const currentUrl = new URL(window.location.href);
    
    // Only allow same-origin URLs or trusted external domains
    if (parsedUrl.origin === currentUrl.origin) {
      return urlStr;
    }
    
    // List of trusted domains (add your own domains here)
    const trustedDomains = [
      'localhost',
      '127.0.0.1',
    ];
    
    if (trustedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
      return urlStr;
    }
  } catch (error) {
    // If URL parsing fails, fallback to homepage
    console.error('Failed to parse URL for security check:', error);
    return '/';
  }
  
  // If URL is not safe, fallback to homepage
  return '/';
}

/**
 * Check if a URL is external (not on the same domain)
 * 
 * @param url The URL to check
 * @returns Boolean indicating if URL is external
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    // On client side, use window.location
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(url, window.location.origin);
      return targetUrl.origin !== currentUrl.origin;
    }
    
    // On server side, consider relative URLs as internal
    return url.startsWith('http:') || url.startsWith('https:');
  } catch (_error) {
    // If parsing fails, assume it's not external (likely a relative path)
    return false;
  }
}
