/**
 * Confluence API Client
 * Uses @forge/bridge for authenticated requests within the Forge context.
 */

import { requestConfluence } from "@forge/bridge";
import { API_ENDPOINTS } from "../constants";

/**
 * Fetches page data including content in storage format.
 * @param {string} pageId - Target Confluence page ID
 * @returns {Promise<Object>} Page object with id, title, body.storage.value, etc.
 */
export async function getPageInfo(pageId) {
  if (!pageId) {
    throw new Error("Page ID is required to fetch page info");
  }
  const url = API_ENDPOINTS.PAGE(pageId);

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
 * @param {string} pageId - Target Confluence page ID
 * @returns {Promise<Array>} Array of comment objects filtered by pageId
 */
export async function getInlineComments(pageId) {
  if (!pageId) {
    throw new Error("Page ID is required to fetch inline comments");
  }

  const response = await requestConfluence(API_ENDPOINTS.INLINE_COMMENTS(pageId), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Inline comments API failed: HTTP ${response.status}\n${errorText}`);
  }

  const data = await response.json();
  return data.results.filter((comment) => comment.pageId === pageId);
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
