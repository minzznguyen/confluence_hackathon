/**
 * Confluence API Client
 * Uses @forge/bridge for authenticated requests within the Forge context.
 */

import { requestConfluence } from "@forge/bridge";
import { PAGE_ID, API_ENDPOINTS } from "../config";

/**
 * Fetches page data including content in storage format.
 * @returns {Promise<Object>} Page object with id, title, body.storage.value, etc.
 */
export async function getPageInfo() {
  const url = API_ENDPOINTS.PAGE(PAGE_ID);

  const response = await requestConfluence(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Page API failed: HTTP ${response.status}\nURL: ${url}\nResponse:\n${errorText}`);
  }

  return response.json();
}

/**
 * Fetches inline comments for the current page.
 * @returns {Promise<Array>} Array of comment objects filtered by PAGE_ID
 */
export async function getInlineComments() {
  const response = await requestConfluence(API_ENDPOINTS.INLINE_COMMENTS, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Inline comments API failed: HTTP ${response.status}\n${errorText}`);
  }

  const data = await response.json();
  return data.results.filter((comment) => comment.pageId === PAGE_ID);
}

/**
 * Fetches user profile by Atlassian account ID.
 * @param {string} accountId - The user's Atlassian account ID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserInfo(accountId) {
  if (!accountId) {
    throw new Error("Missing accountId");
  }

  const response = await requestConfluence(API_ENDPOINTS.USER(accountId), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`User API failed: HTTP ${response.status}\n${errorText}`);
  }

  return response.json();
}
