import { getPageInfo } from "../api";
import { convertConfluenceImages } from "./imageConverter";
import { getPageContext } from "./contextUtils";

/**
 * Loads page data for the space page module.
 * 
 * Gets pageId from Forge storage (populated by the background script).
 * 
 * @param {Object} context - The Forge context object (unused, kept for API compatibility)
 * @returns {Promise<Object>} Object containing page, html, and baseUrl
 * @throws {Error} If no page has been tracked yet
 */
export async function loadPageForSpacePage(context) {
  // Get page context from Forge storage (single source of truth)
  const { pageId, baseUrl } = await getPageContext();
  
  // Fetch page data and convert images
  const page = await getPageInfo(pageId);
  
  const html = convertConfluenceImages(
    page.body.storage.value,
    page.id,
    baseUrl
  );
  
  return {
    page,
    html,
    baseUrl
  };
}
