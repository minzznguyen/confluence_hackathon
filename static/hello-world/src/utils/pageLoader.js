import { getPageInfo } from "../api/confluence";
import { processedHTML } from "./htmlProcessing";
import { getPageContext } from "./contextUtils";

// Loads and processes a Confluence page for display
export async function loadPage() {
  try {
    const { pageId, spaceId, spaceKey, baseUrl } = await getPageContext();
    const page = await getPageInfo(pageId);
    
    // Null checks for API response structure
    if (!page) {
      throw new Error('Page data is missing from API response');
    }
    
    if (!page.body?.storage?.value) {
      throw new Error('Page content is missing or invalid. The page may be empty or corrupted.');
    }
    
    if (!page.id) {
      throw new Error('Page ID is missing from API response');
    }
    
    const html = processedHTML(page.body.storage.value, page.id, baseUrl);

    return {
      page,
      html,
      contextInfo: { pageId, spaceId, spaceKey },
      baseUrl
    };
  } catch (error) {
    throw new Error(`Failed to load page: ${error.message || error}`);
  }
}
