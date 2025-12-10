import { view, invoke } from "@forge/bridge";

/**
 * Unified utility for extracting context information from Forge apps.
 * 
 * This module provides a single source of truth for:
 * - Base URL extraction (from _hostname_ parameter in iframe URL)
 * - Page ID extraction (from Forge storage - the only reliable source)
 * 
 * All modules (byline, space page, full page) use Forge storage to get
 * the page ID, which is populated by the background script on every page view.
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
 * Gets the current page context from Forge storage.
 * 
 * This is the single source of truth for page ID across all modules.
 * The background script (page-tracker) stores the current page ID
 * whenever a user views a Confluence page.
 * 
 * @returns {Promise<Object>} Object containing pageId, spaceId, spaceKey, baseUrl
 * @throws {Error} If no page has been tracked yet
 */
export async function getPageContext() {
  const context = await view.getContext();
  const baseUrl = getBaseUrl();
  
  // Get page ID from Forge storage (single source of truth)
  const storageResult = await invoke('getCurrentPageId');
  
  if (!storageResult?.pageId) {
    throw new Error('No page has been tracked yet. Please view a Confluence page first.');
  }
  
  const pageId = storageResult.pageId;
  const pageInfo = storageResult.pageInfo || {};
  
  return {
    pageId,
    spaceId: pageInfo.spaceId,
    spaceKey: pageInfo.spaceKey,
    baseUrl,
    moduleType: context.extension?.type,
    context
  };
}
