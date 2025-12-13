import { API_ENDPOINTS, ERROR_MESSAGES } from "../constants";
import { getApiRequest } from "./apiClient";

/**
 * Fetches page data from Confluence API.
 * @param {string} pageId - Confluence page ID
 * @returns {Promise<Object>} Page data object
 */
export async function getPageInfo(pageId) {
  if (!pageId) {
    throw new Error(ERROR_MESSAGES.MISSING_PAGE_ID);
  }
  return getApiRequest(API_ENDPOINTS.PAGE(pageId), 'Page API');
}

/**
 * Fetches inline comments for a page and filters by pageId.
 * Additional filtering ensures we only return comments for the specified page.
 * 
 * @param {string} pageId - Confluence page ID
 * @returns {Promise<Array>} Array of inline comment objects
 */
export async function getInlineComments(pageId) {
  if (!pageId) {
    throw new Error(ERROR_MESSAGES.MISSING_PAGE_ID);
  }

  const data = await getApiRequest(API_ENDPOINTS.INLINE_COMMENTS(pageId), 'Inline comments API');
  
  if (!data || !Array.isArray(data.results)) {
    return [];
  }
  // Filter to ensure comments belong to the specified page (API may return related comments)
  return data.results.filter((comment) => comment?.pageId === pageId);
}

/**
 * Fetches user information from Confluence API.
 * @param {string} accountId - User account ID
 * @returns {Promise<Object>} User data object
 */
export async function getUserInfo(accountId) {
  if (!accountId) {
    throw new Error(ERROR_MESSAGES.MISSING_ACCOUNT_ID);
  }
  return getApiRequest(API_ENDPOINTS.USER(accountId), 'User API');
}
