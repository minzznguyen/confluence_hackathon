import { view } from "@forge/bridge";
import { ERROR_MESSAGES } from "../constants";

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
 * Parses location URL to extract pageId, spaceId, and spaceKey from query string.
 * 
 * @returns {Promise<Object>} Object containing pageId, spaceId, spaceKey, baseUrl, moduleType, and context
 * @throws {Error} If pageId is missing from URL parameters
 */
export async function getPageContext() {
  const context = await view.getContext();
  const baseUrl = getBaseUrl();
  const locationUrl = context.extension?.location || context.location;
  
  let pageId, spaceId, spaceKey;
  if (locationUrl) {
    // Extract query parameters from URL (format: ?pageId=123&spaceId=456&spaceKey=ABC)
    const queryStart = locationUrl.indexOf('?');
    if (queryStart !== -1) {
      const params = new URLSearchParams(locationUrl.substring(queryStart + 1));
      pageId = params.get('pageId');
      spaceId = params.get('spaceId');
      spaceKey = params.get('spaceKey');
    }
  }
  
  if (!pageId) throw new Error(ERROR_MESSAGES.NO_PAGE_ID_IN_URL);
  
  return { pageId, spaceId, spaceKey, baseUrl, moduleType: context.extension?.type, context };
}
