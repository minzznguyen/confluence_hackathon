import { STORAGE_KEYS } from "../constants";

/**
 * Stores page context information in localStorage.
 * Used to persist context when navigating from content inline/byline module to space app.
 * 
 * @param {Object} contextData - Context data to store
 * @param {string} contextData.pageId - Page ID
 * @param {string} [contextData.spaceId] - Space ID
 * @param {string} [contextData.spaceKey] - Space key
 * @param {string} contextData.envId - Environment ID
 * @param {string} contextData.appId - App ID
 * @param {string} [contextData.baseUrl] - Base URL
 */
export function storePageContext(contextData) {
  try {
    const dataToStore = {
      pageId: contextData.pageId,
      spaceId: contextData.spaceId,
      spaceKey: contextData.spaceKey,
      envId: contextData.envId,
      appId: contextData.appId,
      baseUrl: contextData.baseUrl,
      timestamp: Date.now(), // Store timestamp for potential expiration
    };
    localStorage.setItem(STORAGE_KEYS.PAGE_CONTEXT, JSON.stringify(dataToStore));
  } catch (error) {
    console.error('ERROR: Failed to store page context:', error);
    // localStorage might not be available in some contexts, fail silently
  }
}

/**
 * Retrieves page context information from localStorage.
 * Returns null if no context is stored or if retrieval fails.
 * 
 * @returns {Object|null} Stored context data or null
 */
export function getStoredPageContext() {  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PAGE_CONTEXT);
    if (!stored) {
      console.log('[STORAGE] No data found in localStorage for key:', STORAGE_KEYS.PAGE_CONTEXT);
      return null;
    }
    
    const contextData = JSON.parse(stored);
    return contextData;
  } catch (error) {
    console.error('ERROR: Failed to retrieve page context from localStorage:', error);
    return null;
  }
}

/**
 * Clears stored page context from localStorage.
 */
export function clearStoredPageContext() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PAGE_CONTEXT);
  } catch (error) {
    console.error('ERROR: Failed to clear page context:', error);
  }
}

