import { router } from "@forge/bridge";
import { APP_ID, DEVELOPMENT_ENV, CONFLUENCE_MODULES } from "../constants";

/**
 * Navigates from byline item extension context to full page analytics view.
 * Extracts app ID and environment ID from current URL, falls back to constants if not found.
 * 
 * @param {Object} context - Forge view context object
 * @param {string} [context.extension.type] - Extension type
 * @param {string} [context.extension.content.id] - Page ID from extension content
 * @param {string} [context.location] - Current location URL
 */
export async function navigateToFullPage(context) {
  if (context.extension?.type !== CONFLUENCE_MODULES.CONTENT_BYLINE_ITEM) return;

  const pageId = context.extension?.content?.id;
  const currentPath = context.location || window.location.href;
  
  // Extract app and environment IDs from URL pattern: /forge-apps/a/{appId}/e/{envId}/
  const appIdMatch = currentPath.match(/\/forge-apps\/a\/([^\/]+)/);
  const envIdMatch = currentPath.match(/\/e\/([^\/]+)/);
  
  const appId = appIdMatch?.[1] || APP_ID;
  const envId = envIdMatch?.[1] || DEVELOPMENT_ENV;

  const params = pageId ? `?pageId=${pageId}` : '';
  router.open(`/forge-apps/a/${appId}/e/${envId}/r/hello-world${params}`);
}
