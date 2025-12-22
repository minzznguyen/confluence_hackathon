import { router, view } from "@forge/bridge";
import { CONFLUENCE_MODULES } from "../constants";

/**
 * Navigates from byline item extension context to full page analytics view.
 * Uses Forge context to get both app ID and environment ID.
 *
 * @param {Object} context - Forge view context object
 * @param {string} [context.extension.type] - Extension type
 * @param {string} [context.extension.content.id] - Page ID from extension content
 */
export async function navigateToFullPage(context) {
  if (context.extension?.type !== CONFLUENCE_MODULES.CONTENT_BYLINE_ITEM)
    return;

  const pageId = context.extension?.content?.id;

  // Get environment ID directly from context (keep as-is) and app ID from localId
  const fullContext = await view.getContext();
  const envId = fullContext.environmentId;

  // Extract appId from localId (Confluence format: ari-cloud-ecosystem--extension-<appId>-<envId>-...)
  let appId;
  const localId = fullContext.localId;
  if (localId) {
    const match = localId.match(
      /ari-cloud-ecosystem--extension-([^-/]+-[^-/]+-[^-/]+-[^-/]+-[^-/]+)-/
    );
    if (match && match[1]) {
      appId = match[1];
    }
  }

  if (!appId) {
    throw new Error(
      "Could not extract app ID from localId 2. Navigation aborted."
    );
  }
  if (!envId) {
    throw new Error(
      "Could not extract environment ID from Forge context. Navigation aborted."
    );
  }

  const params = pageId ? `?pageId=${pageId}` : "";
  router.open(`/forge-apps/a/${appId}/e/${envId}/r/heatmap${params}`);
}
