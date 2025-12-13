import { requestConfluence } from "@forge/bridge";
import { HTTP_HEADERS } from "../constants";

/**
 * Shared API client wrapper for Confluence API GET requests only.
 * Centralizes error handling and JSON response parsing.
 * 
 * @param {string} url - Full API endpoint URL
 * @param {string} [errorContext='API'] - Context label for error messages
 * @returns {Promise<Object>} Parsed JSON response data
 * @throws {Error} If request fails or response is not ok
 */
export async function getApiRequest(url, errorContext = 'API') {
  const response = await requestConfluence(url, {
    method: 'GET',
    headers: HTTP_HEADERS.JSON
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${errorContext} failed: HTTP ${response.status}\nURL: ${url}\nResponse:\n${errorText}`);
  }

  return response.json();
}
