import { router, view } from "@forge/bridge";
import { CONFLUENCE_MODULES } from "../constants";
import { storePageContext } from "./storage";
import { getBaseUrl } from "./contextUtils";

/**
 * Extracts and stores page context from content byline item module to localStorage.
 * This is called when the app loads in a content byline item context.
 * Stores context without navigating.
 * 
 * @param {Object} context - Forge view context object
 * @returns {Object} Extracted context data with pageId, spaceId, spaceKey, envId, appId, baseUrl
 */
export async function extractAndStorePageContext(context) {
  const fullContext = await view.getContext();
  const envId = fullContext.environmentId;

  // Extract appId from localId (Confluence format: ari-cloud-ecosystem--extension-<appId>-<envId>-...)
  let appId;
  const localId = fullContext.localId;
  if (localId) {
    const match = localId.match(/ari-cloud-ecosystem--extension-([^-/]+-[^-/]+-[^-/]+-[^-/]+-[^-/]+)-/);
    if (match && match[1]) {
      appId = match[1];
    }
  }

  if (!appId) {
    throw new Error("Could not extract app ID from localId. Navigation aborted.");
  }
  if (!envId) {
    throw new Error("Could not extract environment ID from Forge context. Navigation aborted.");
  }

  // Extract page context from extension content or location URL
  const pageId = context.extension?.content?.id;
  const locationUrl = context.extension?.location || context.location;
  
  let spaceId, spaceKey;
  if (locationUrl) {
    const queryStart = locationUrl.indexOf('?');
    if (queryStart !== -1) {
      const params = new URLSearchParams(locationUrl.substring(queryStart + 1));
      spaceId = params.get('spaceId');
      spaceKey = params.get('spaceKey');
    }
  }

  if (!pageId) {
    console.error('ERROR: Could not extract page ID from context');
    throw new Error("Could not extract page ID from context. Navigation aborted.");
  }

  // Get base URL
  let baseUrl;
  try {
    baseUrl = getBaseUrl();
  } catch (error) {
    baseUrl = null;
  }

  // Store context in localStorage
  const contextData = {
    pageId,
    spaceId,
    spaceKey,
    envId,
    appId,
    baseUrl,
  };

  storePageContext(contextData);

  return contextData;
}

/**
 * Navigates from content byline item extension context to space page app.
 * Extracts and stores page context (pageId, spaceId, envId, appId, etc.) in localStorage
 * before navigating, so the space page can use this stored context.
 * 
 * @param {Object} context - Forge view context object
 * @param {string} [context.extension.type] - Extension type
 * @param {string} [context.extension.content.id] - Page ID from extension content
 */
export async function navigateToFullPage(context) {
  if (context.extension?.type !== CONFLUENCE_MODULES.CONTENT_BYLINE_ITEM) {
    return;
  }

  // Extract and store page context from current content byline item module
  const contextData = await extractAndStorePageContext(context);

  // const params = contextData.pageId ? `?pageId=${contextData.pageId}` : '';
  const targetUrl = `/wiki/spaces/~${contextData.spaceKey}/apps/${contextData.appId}/${contextData.envId}/hello-world`;

  // Navigate to space page (opens in new tab/window)
  router.navigate(targetUrl);
}
