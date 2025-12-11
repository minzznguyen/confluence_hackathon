import { getPageInfo } from "../api/confluence";
import { processConfluenceHtml } from "./htmlProcessing";
import { getPageContext } from "./contextUtils";

/**
 * Loads and processes a Confluence page for display in the analytics dashboard.
 *
 * Flow:
 * 1) getPageContext pulls pageId/space info and baseUrl from the URL params
 *    (set by the byline navigation) via context.extension.location.
 * 2) getPageInfo fetches that page’s content from Confluence.
 * 3) processConfluenceHtml converts storage-format HTML to renderable HTML
 *    (images + inline comment highlighting).
 *
 * @returns {Promise<Object>} Object containing:
 *   - page: Raw page object from Confluence API
 *   - html: Converted HTML ready for rendering
 *   - contextInfo: Metadata about the page (pageId, spaceId, spaceKey)
 *   - baseUrl: The base URL of the Confluence site
 * @throws {Error} If page cannot be loaded
 */
export async function loadPage() {
  // Get page context from URL parameters (set by byline navigation)
  const { pageId, spaceId, spaceKey, baseUrl } = await getPageContext();
  
  // Fetch page info for the requested page
  const page = await getPageInfo(pageId);

  // Convert Confluence storage-format HTML to standard HTML with inline comment highlighting
  const html = processConfluenceHtml(page.body.storage.value, page.id, baseUrl);

  return {
    page,
    html,
    contextInfo: {
      pageId,
      spaceId,
      spaceKey
    },
    baseUrl
  };
}
