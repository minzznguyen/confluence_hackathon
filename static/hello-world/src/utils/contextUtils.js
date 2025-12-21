import { view } from "@forge/bridge";
import { ERROR_MESSAGES, CONFLUENCE_MODULES } from "../constants";
import { getStoredPageContext } from "./storage";

/**
 * Extracts Confluence instance base URL from iframe hostname pattern.
 * URL pattern: /_hostname_{hostname}/...
 * 
 * @returns {string} Base URL (e.g., "https://example.atlassian.net")
 * @throws {Error} If hostname pattern is not found in URL
 */
export function getBaseUrl() {
  const match = window.location.href.match(/\/_hostname_([^\/_?]+)/);
  if (!match?.[1]) throw new Error(ERROR_MESSAGES.COULD_NOT_EXTRACT_HOSTNAME);
  return `https://${match[1]}`;
}

/**
 * Extracts page context information from Forge view context and URL query parameters.
 * First checks localStorage for stored context (from content byline item module), then falls back to
 * extracting from current context/URL.
 * Parses location URL to extract pageId, spaceId, and spaceKey from query string.
 * 
 * @returns {Promise<Object>} Object containing pageId, spaceId, spaceKey, baseUrl, moduleType, and context
 * @throws {Error} If pageId is missing
 */
export async function getPageContext() {
  const context = await view.getContext();
  const moduleType = context.extension?.type;
  
  // If in space page module, try to get stored context from localStorage first
  if (moduleType === CONFLUENCE_MODULES.SPACE_PAGE) {
    const storedContext = getStoredPageContext();
    
    if (storedContext && storedContext.pageId) {
      // Use stored context, but try to get baseUrl from current location if not stored
      let baseUrl = storedContext.baseUrl;
      if (!baseUrl) {
        try {
          baseUrl = getBaseUrl();
        } catch (error) {
          // baseUrl will remain null if extraction fails
        }
      }
      
      return {
        pageId: storedContext.pageId,
        spaceId: storedContext.spaceId,
        spaceKey: storedContext.spaceKey,
        baseUrl: baseUrl,
        moduleType: moduleType,
        context: context,
        envId: storedContext.envId,
        appId: storedContext.appId,
      };
    }
  }
  
  // Fallback: Extract from current context/URL
  const baseUrl = getBaseUrl();
  const locationUrl = context.extension?.location || context.location;
  
  let pageId, spaceId, spaceKey;
  if (locationUrl) {
    const queryStart = locationUrl.indexOf('?');
    if (queryStart !== -1) {
      const params = new URLSearchParams(locationUrl.substring(queryStart + 1));
      pageId = params.get('pageId');
      spaceId = params.get('spaceId');
      spaceKey = params.get('spaceKey');
    }
  }
  
  // Also try to get pageId from extension content if not in URL
  if (!pageId && context.extension?.content?.id) {
    pageId = context.extension.content.id;
  }
  
  if (!pageId) {
    console.error('ERROR: No pageId found');
    throw new Error(ERROR_MESSAGES.NO_PAGE_ID_IN_URL);
  }
  
  return { pageId, spaceId, spaceKey, baseUrl, moduleType, context };
}

