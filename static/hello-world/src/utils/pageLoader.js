import { getPageInfo, getInlineComments } from "../api/confluence";
import { processedHTML } from "./htmlProcessing";
import { getPageContext } from "./contextUtils";
import { ERROR_MESSAGES } from "../constants";

/**
 * Loads and processes a Confluence page from the API.
 * Extracts page context, fetches page data and inline comments, validates content,
 * and converts storage format to HTML with color-coded comment markers.
 *
 * @returns {Promise<Object>} Object containing:
 *   - page: Raw page data from API
 *   - html: Processed HTML ready for rendering
 *   - comments: Array of inline comments
 *   - contextInfo: {pageId, spaceId, spaceKey}
 *   - baseUrl: Confluence instance base URL
 * @throws {Error} If page data is missing, invalid, or loading fails
 */
export async function loadPage() {
  try {
    const { pageId, spaceId, spaceKey, baseUrl } = await getPageContext();
    const page = await getPageInfo(pageId);

    if (!page) {
      throw new Error(ERROR_MESSAGES.MISSING_PAGE_DATA_FROM_API);
    }

    if (!page.body?.storage?.value) {
      throw new Error(ERROR_MESSAGES.INVALID_PAGE_CONTENT);
    }

    if (!page.id) {
      throw new Error(ERROR_MESSAGES.MISSING_PAGE_ID_FROM_API);
    }

    // Fetch comments for color ranking
    const comments = await getInlineComments(pageId) || [];
    const html = processedHTML(page.body.storage.value, page.id, baseUrl, comments);

    return {
      page,
      html,
      comments,
      contextInfo: { pageId, spaceId, spaceKey },
      baseUrl,
    };
  } catch (error) {
    throw new Error(
      `${ERROR_MESSAGES.FAILED_TO_LOAD_PAGE}: ${error.message || error}`
    );
  }
}
