import { useEffect, useState, useCallback, useRef } from "react";
import { view } from "@forge/bridge";
import { navigateToFullPage } from "./utils/navigation";
import { loadPage } from "./utils/pageLoader";
import { markCommentedBlocks } from "./utils/htmlProcessing";
import { getInlineComments } from "./api/confluence";
import CommentRepliesChart from "./components/CommentRepliesChart";
import Heading from "@atlaskit/heading";
import InlineMessage from "@atlaskit/inline-message";
import Spinner from "@atlaskit/spinner";

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Track current request ID to ignore stale responses
  const requestIdRef = useRef(0);

  /**
   * Load page data based on module type.
   */
  const loadPageData = useCallback(async () => {
    // Increment request ID for this request
    const currentRequestId = ++requestIdRef.current;
    
    // Helper to safely set state only if component is still mounted and this is the latest request
    const safeSetState = (setter, value) => {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setter(value);
      }
    };
    
    safeSetState(setIsLoading, true);
    safeSetState(setError, null);

    try {
      const context = await view.getContext();
      const type = context.extension?.type;

      // Handle byline item - navigate and close immediately
      if (type === 'confluence:contentBylineItem') {
        await navigateToFullPage(context);
        view.close(); // Close the modal immediately after navigation
        return;
      }

      // Handle full page
      const { page: loadedPage, html: convertedHtml, contextInfo } = await loadPage();
      
      // Check if this request is still current before updating state
      if (currentRequestId !== requestIdRef.current) {
        return; // Stale request, ignore
      }
      
      // Null check for loaded page
      if (!loadedPage) {
        throw new Error('Page data is missing');
      }
      
      safeSetState(setPage, loadedPage);
      safeSetState(setHtml, convertedHtml);

      const inlineComments = await getInlineComments(contextInfo?.pageId);
      
      // Check again if request is still current
      if (currentRequestId !== requestIdRef.current) {
        return; // Stale request, ignore
      }
      
      safeSetState(setComments, inlineComments || []);
      safeSetState(setIsLoading, false);
      
    } catch (err) {
      // Only update error state if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        safeSetState(setError, err.message || 'An unexpected error occurred');
        safeSetState(setIsLoading, false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadPageData();
    
    // Cleanup: mark component as unmounted
    return () => {
      isMountedRef.current = false;
      // Increment request ID to invalidate any in-flight requests
      requestIdRef.current++;
    };
  }, [loadPageData]);

  // After HTML renders, mark blocks that contain inline comments
  useEffect(() => {
    if (!html || isLoading) return;
    // Use requestAnimationFrame for better performance than setTimeout
    const rafId = requestAnimationFrame(() => {
      markCommentedBlocks();
    });
    return () => cancelAnimationFrame(rafId);
  }, [html, isLoading]);

  if (error) {
    return (
      <div className="conf-container">
        <InlineMessage
          type="error"
          title="Error loading page"
        >
          {error}
        </InlineMessage>
      </div>
    );
  }
  
  if (isLoading || !page) {
    return (
      <div className="conf-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Spinner size="medium" />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="conf-page-wrapper">
      {/* Left Sidebar - Chart */}
      <aside className="conf-sidebar">
        <div className="conf-chart-section">
          <Heading as="h2">Comment Thread Activity</Heading>
          <CommentRepliesChart 
            comments={comments} 
            status="open"
            maxItems={20}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="conf-main">
        <div className="conf-container">
          <Heading as="h1" size="xlarge">{page?.title || 'Untitled Page'}</Heading>
          <div
            className="conf-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
    </div>
  );
}
