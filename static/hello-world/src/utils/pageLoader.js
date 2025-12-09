import { view, invoke } from "@forge/bridge";
import { getPageInfo } from "../api";
import { convertConfluenceImages } from "./imageConverter";

/**
 * Loads and processes a Confluence page for display in the analytics dashboard.
 * 
 * This function implements a triple-fallback system to get the pageId:
 * 1. From extension context (context.extension.content.id) - works for byline/content action
 * 2. From URL parameters (context.location query string) - works for full page with params
 * 3. From Forge storage (invoke('getCurrentPageId')) - fallback when above fail
 * 
 * Then it:
 * - Fetches the page data from Confluence API
 * - Extracts the dynamic base URL from the current site
 * - Converts Confluence storage format HTML to standard HTML
 * 
 * @returns {Promise<Object>} Object containing:
 *   - page: The raw page object from Confluence API
 *   - html: Converted HTML ready for rendering
 *   - contextInfo: Metadata about the page (pageId, spaceId, spaceKey)
 *   - baseUrl: The base URL of the Confluence site
 * @throws {Error} If page cannot be loaded
 */
export async function loadPage() {
  // Get context from Forge bridge
  const context = await view.getContext();
  
  // Strategy 1: Try to get pageId from extension context (works for byline/content action)
  let pageIdFromUrl = context.extension?.content?.id;
  let spaceIdFromUrl = context.extension?.space?.id;
  let spaceKeyFromUrl = context.extension?.space?.key;
  
  // Strategy 2: If not in extension context, parse from context.location (for full page)
  if (!pageIdFromUrl && context.location) {
    const queryStart = context.location.indexOf('?');
    if (queryStart !== -1) {
      const queryString = context.location.substring(queryStart + 1);
      const params = new URLSearchParams(queryString);
      
      pageIdFromUrl = params.get('pageId');
      spaceIdFromUrl = spaceIdFromUrl || params.get('spaceId');
      spaceKeyFromUrl = spaceKeyFromUrl || params.get('spaceKey');
    }
  }
  
  // Strategy 3: Last resort - try Forge storage
  if (!pageIdFromUrl) {
    try {
      const storageResult = await invoke('getCurrentPageId');
      if (storageResult && storageResult.pageId) {
        pageIdFromUrl = storageResult.pageId;
        spaceIdFromUrl = spaceIdFromUrl || storageResult.spaceId;
        spaceKeyFromUrl = spaceKeyFromUrl || storageResult.spaceKey;
      }
    } catch (e) {
      console.error('Failed to retrieve from Forge storage:', e);
    }
  }
  
  // Extract base URL from context (dynamic per site)
  let baseUrl = 'https://atlassianhackathon2025.atlassian.net'; // fallback
  
  if (context.location) {
    // Parse base URL from context.location
    const urlMatch = context.location.match(/^(https?:\/\/[^\/]+)/);
    if (urlMatch) {
      baseUrl = urlMatch[1];
    }
  }
  
  // Try to extract from parent window as fallback
  try {
    const parentUrl = window.parent.location.origin;
    if (parentUrl && parentUrl !== 'null') {
      baseUrl = parentUrl;
    }
  } catch (e) {
    // Cross-origin blocked, use context-based fallback
  }
  
  // Fetch page info using the determined page ID
  if (!pageIdFromUrl) {
    throw new Error('Unable to determine page ID. Please navigate from a Confluence page.');
  }
  
  const page = await getPageInfo(pageIdFromUrl);
  const pageId = page.id;

  // Convert Confluence storage-format HTML to standard HTML with dynamic base URL
  const html = convertConfluenceImages(
    page.body.storage.value,
    pageId,
    baseUrl
  );

  return {
    page,
    html,
    contextInfo: {
      pageId: pageIdFromUrl,
      spaceId: spaceIdFromUrl,
      spaceKey: spaceKeyFromUrl
    },
    baseUrl
  };
}

