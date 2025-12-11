import { getPageInfo } from "../api/confluence";
import { convertConfluenceImages } from "./imageConverter";
import { getPageContext } from "./contextUtils";

/**
 * Loads and processes a Confluence page for display in the analytics dashboard.
 * 
 * Gets pageId from Forge storage (populated by the background script).
 * 
 * @returns {Promise<Object>} Object containing:
 *   - page: The raw page object from Confluence API
 *   - html: Converted HTML ready for rendering
 *   - contextInfo: Metadata about the page (pageId, spaceId, spaceKey)
 *   - baseUrl: The base URL of the Confluence site
 * @throws {Error} If page cannot be loaded
 */
export async function loadPage() {
  // Get page context from Forge storage (single source of truth)
  const { pageId, spaceId, spaceKey, baseUrl } = await getPageContext();
  
  // Fetch page info using the page ID from storage
  const page = await getPageInfo(pageId);

  // Convert Confluence storage-format HTML to standard HTML
  const html = convertConfluenceImages(
    page.body.storage.value,
    page.id,
    baseUrl
  );

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
