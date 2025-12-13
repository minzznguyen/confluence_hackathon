import { requestConfluence } from "@forge/bridge";
import { HTTP_HEADERS } from "../constants";

/**
 * Shared API client wrapper for Confluence API requests.
 * Handles error handling and response parsing.
 */
export async function apiRequest(url, errorContext = 'API') {
  const response = await requestConfluence(url, {
    headers: HTTP_HEADERS.JSON
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${errorContext} failed: HTTP ${response.status}\nURL: ${url}\nResponse:\n${errorText}`);
  }

  return response.json();
}
