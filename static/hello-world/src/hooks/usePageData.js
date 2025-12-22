import { useState, useCallback, useEffect } from 'react';
import { view } from "@forge/bridge";
import { navigateToFullPage } from "../utils/navigation";
import { loadPage } from "../utils/pageLoader";
import { CONFLUENCE_MODULES, ERROR_MESSAGES } from "../constants";
import { useSafeAsync } from "./useSafeAsync";

/**
 * Hook for managing page data loading with safe async operations.
 * Automatically handles byline item extension context by navigating to full page view.
 * For full page context, loads page content, converts HTML, and fetches inline comments.
 * 
 * @returns {Object} Object containing page, html, comments, error, isLoading, and loadPageData
 */
export function usePageData() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { setSafeState, startRequest } = useSafeAsync();

  const loadPageData = useCallback(async () => {
    const currentRequestId = startRequest();
    // Wrapper to ensure all state updates are safe (checks mount status and request ID)
    const safeUpdate = (setter, value) => {
      setSafeState(setter, value, currentRequestId);
    };
    
    safeUpdate(setIsLoading, true);
    safeUpdate(setError, null);

    try {
      const context = await view.getContext();
      const type = context.extension?.type;

      // If loaded from byline item extension, navigate to full page and close
      if (type === CONFLUENCE_MODULES.CONTENT_BYLINE_ITEM) {
        await navigateToFullPage(context);
        view.close();
        return;
      }

      const { page: loadedPage, html: convertedHtml, comments: inlineComments } = await loadPage();
      safeUpdate(setPage, loadedPage);
      safeUpdate(setHtml, convertedHtml);
      safeUpdate(setComments, inlineComments);
      safeUpdate(setIsLoading, false);
      
    } catch (err) {
      safeUpdate(setError, err.message || ERROR_MESSAGES.UNEXPECTED_ERROR);
      safeUpdate(setIsLoading, false);
    }
  }, [setSafeState, startRequest]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  return { page, html, comments, error, isLoading, loadPageData };
}
