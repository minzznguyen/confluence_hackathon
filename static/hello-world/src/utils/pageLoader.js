import { getPageInfo, getInlineComments } from "../api/confluence";
import { processedHTML } from "./htmlProcessing";
import { getPageContext } from "./contextUtils";

/**
 * Loads and processes a Confluence page for display in the analytics dashboard.
 *
 * Flow:
 * 1) getPageContext pulls pageId/space info and baseUrl from the URL params
 *    (set by the byline navigation) via context.extension.location.
 * 2) getPageInfo fetches that page's content from Confluence.
 * 3) getInlineComments fetches comments for color ranking (parallel with page fetch).
 * 4) processedHTML converts storage-format HTML to renderable HTML
 *    (images + inline comment highlighting with dynamic colors).
 *
 * @returns {Promise<Object>} Object containing:
 *   - page: Raw page object from Confluence API
 *   - html: Converted HTML ready for rendering
 *   - contextInfo: Metadata about the page (pageId, spaceId, spaceKey)
 *   - baseUrl: The base URL of the Confluence site
 *   - comments: Array of inline comments for the page
 * @throws {Error} If page cannot be loaded
 */
export async function loadPage() {
  try {
    // Get page context from URL parameters (set by byline navigation)
    const { pageId, spaceId, spaceKey, baseUrl } = await getPageContext();
    
    // Fetch page info and inline comments in parallel
    const [page, comments] = await Promise.all([
      getPageInfo(pageId),
      getInlineComments(pageId).catch(() => []) // Gracefully handle if comments fail to load
    ]);

    // Convert Confluence storage-format HTML to standard HTML with ranked comment highlighting
    const html = processedHTML(page.body.storage.value, page.id, baseUrl, comments);

    // Return structured result with comments included
    return {
      page,
      html,
      contextInfo: {
        pageId,
        spaceId,
        spaceKey
      },
      baseUrl,
      comments
    };
  } catch (error) {
    // Wrap and re-throw error with more context so handlers/logs can distinguish load errors
    throw new Error(`Failed to load page: ${error.message || error}`);
  }
}
