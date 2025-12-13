import { getPageInfo } from "../api/confluence";
import { processedHTML } from "./htmlProcessing";
import { getPageContext } from "./contextUtils";
import { ERROR_MESSAGES } from "../constants";

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
    
    const html = processedHTML(page.body.storage.value, page.id, baseUrl);

    return {
      page,
      html,
      contextInfo: { pageId, spaceId, spaceKey },
      baseUrl
    };
  } catch (error) {
    throw new Error(`${ERROR_MESSAGES.FAILED_TO_LOAD_PAGE}: ${error.message || error}`);
  }
}
