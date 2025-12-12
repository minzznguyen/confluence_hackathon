import { view } from "@forge/bridge";

/**
 * Unified utility for extracting context information from Forge apps.
 * 
 * This module provides a single source of truth for:
 * - Base URL extraction (from _hostname_ parameter in iframe URL)
 * - Page ID extraction (from URL query parameters passed during navigation)
 */

/**
 * Extracts the Confluence base URL from the current window location.
 * 
 * Forge Custom UI apps run in an iframe with a CDN URL that includes
 * the actual Confluence site hostname in the path:
 * .../_hostname_<site>.atlassian.net/...
 * 
 * @returns {string} The base URL (e.g., "https://mysite.atlassian.net")
 * @throws {Error} If hostname cannot be extracted
 */
export function getBaseUrl() {
  const currentUrl = window.location.href;
  
  // Extract hostname from the _hostname_ parameter in the URL path
  const hostnameMatch = currentUrl.match(/\/_hostname_([^\/_?]+)/);
  
  if (!hostnameMatch || !hostnameMatch[1]) {
    throw new Error('Could not extract Confluence hostname from URL.');
  }
  
  return `https://${hostnameMatch[1]}`;
}

/**
 * Gets the current page context from URL query parameters.
 * 
 * The byline item passes pageId, spaceId, and spaceKey as URL parameters
 * when navigating to the full page analytics view.
 * 
 * Extracts query parameters from the context.location property which contains
 * the full Forge app URL with query string.
 * 
 * @returns {Promise<Object>} Object containing pageId, spaceId, spaceKey, baseUrl
 * @throws {Error} If pageId is not found in URL parameters
 */
export async function getPageContext() {
  const context = await view.getContext();
  const baseUrl = getBaseUrl();
  
  // Extract query parameters from context.extension.location
  // For fullPage modules, the location is at context.extension.location
  let pageId, spaceId, spaceKey;
  const locationUrl = context.extension?.location || context.location;
  
  if (locationUrl) {
    const queryStart = locationUrl.indexOf('?');
    
    if (queryStart !== -1) {
      const queryString = locationUrl.substring(queryStart + 1);
      const urlParams = new URLSearchParams(queryString);
      
      pageId = urlParams.get('pageId');
      spaceId = urlParams.get('spaceId');
      spaceKey = urlParams.get('spaceKey');
    }
  }
  
  if (!pageId) {
    throw new Error('No pageId found in URL parameters. This page must be opened from a byline item.');
  }
  
  return {
    pageId,
    spaceId,
    spaceKey,
    baseUrl,
    moduleType: context.extension?.type,
    context
  };
}
