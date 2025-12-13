import { useState, useCallback, useEffect } from 'react';
import { view } from "@forge/bridge";
import { navigateToFullPage } from "../utils/navigation";
import { loadPage } from "../utils/pageLoader";
import { getInlineComments } from "../api/confluence";
import { MODULE_TYPES, ERROR_MESSAGES } from "../constants";
import { useSafeAsync } from "./useSafeAsync";

/**
 * Hook for managing page data loading with safe async operations.
 * Handles both byline item navigation and full page loading.
 */
export function usePageData() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { safeSetState, startRequest, isCurrentRequest } = useSafeAsync();

  const loadPageData = useCallback(async () => {
    const currentRequestId = startRequest();
    const safeUpdate = (setter, value) => {
      safeSetState(setter, value, currentRequestId);
    };
    
    safeUpdate(setIsLoading, true);
    safeUpdate(setError, null);

    try {
      const context = await view.getContext();
      const type = context.extension?.type;

      if (type === MODULE_TYPES.CONTENT_BYLINE_ITEM) {
        await navigateToFullPage(context);
        view.close();
        return;
      }

      const { page: loadedPage, html: convertedHtml, contextInfo } = await loadPage();
      
      if (!isCurrentRequest(currentRequestId)) return;
      
      if (!loadedPage) {
        throw new Error(ERROR_MESSAGES.MISSING_PAGE_DATA);
      }
      
      safeUpdate(setPage, loadedPage);
      safeUpdate(setHtml, convertedHtml);

      const inlineComments = await getInlineComments(contextInfo?.pageId);
      
      if (!isCurrentRequest(currentRequestId)) return;
      
      safeUpdate(setComments, inlineComments || []);
      safeUpdate(setIsLoading, false);
      
    } catch (err) {
      if (isCurrentRequest(currentRequestId)) {
        safeUpdate(setError, err.message || ERROR_MESSAGES.UNEXPECTED_ERROR);
        safeUpdate(setIsLoading, false);
      }
    }
  }, [safeSetState, startRequest, isCurrentRequest]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  return { page, html, comments, error, isLoading, loadPageData };
}
