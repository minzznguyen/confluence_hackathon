import { view } from "@forge/bridge";
import { ERROR_MESSAGES } from "../constants";

// Extracts Confluence base URL from iframe URL
export function getBaseUrl() {
  const match = window.location.href.match(/\/_hostname_([^\/_?]+)/);
  if (!match?.[1]) throw new Error(ERROR_MESSAGES.COULD_NOT_EXTRACT_HOSTNAME);
  return `https://${match[1]}`;
}

// Gets page context from URL query parameters
export async function getPageContext() {
  const context = await view.getContext();
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
  
  if (!pageId) throw new Error(ERROR_MESSAGES.NO_PAGE_ID_IN_URL);
  
  return { pageId, spaceId, spaceKey, baseUrl, moduleType: context.extension?.type, context };
}
