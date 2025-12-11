import { router } from "@forge/bridge";

/**
 * Handles navigation from byline item to the full page analytics view.
 * 
 * This function:
 * 1. Extracts the current page context (pageId, spaceId, spaceKey)
 * 2. Constructs the full Forge app URL with query parameters
 * 3. Opens the full page in a new tab
 * 
 * @param {Object} context - The Forge context object from view.getContext()
 * @returns {Promise<void>}
 */
export async function navigateToFullPage(context) {
  const moduleType = context.extension?.type;
  
  // Only handle byline item module
  if (moduleType !== 'confluence:contentBylineItem') {
    return;
  }

  // Extract current page/content info to pass to the analytics page
  const pageId = context.extension?.content?.id;
  const spaceId = context.extension?.space?.id;
  const spaceKey = context.extension?.space?.key;
  
  // Extract app ID and environment ID from the current location
  // URL Pattern: /forge-apps/a/{app-id}/e/{env-id}/r/{route}
  const currentPath = context.location || window.location.href;
  const appIdMatch = currentPath.match(/\/forge-apps\/a\/([^\/]+)/);
  const envIdMatch = currentPath.match(/\/e\/([^\/]+)/);
  
  // Use matched IDs or fallback to default (for development)
  const appId = appIdMatch ? appIdMatch[1] : '24e34540-92df-4b82-81a2-46340f7d3440';
  const envId = envIdMatch ? envIdMatch[1] : '839b6a23-c454-41b1-9b1e-9468893d5204';
  
  // Build query parameters with page context
  const params = new URLSearchParams();
  if (pageId) params.append('pageId', pageId);
  if (spaceId) params.append('spaceId', spaceId);
  if (spaceKey) params.append('spaceKey', spaceKey);
  
  // Construct full Forge URL
  const fullUrl = `/forge-apps/a/${appId}/e/${envId}/r/hello-world${params.toString() ? `?${params.toString()}` : ''}`;
  
  // Open full page in new tab
  router.open(fullUrl);
}
