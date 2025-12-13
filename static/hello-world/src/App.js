import { useEffect, useState, useCallback } from "react";
import { view } from "@forge/bridge";
import { navigateToFullPage } from "./utils/navigation";
import { loadPage } from "./utils/pageLoader";
import { markCommentedBlocks } from "./utils/htmlProcessing";
import { getInlineComments } from "./api/confluence";
import CommentRepliesChart from "./components/CommentRepliesChart";
import "./styles/index.css";

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load page data based on module type.
   */
  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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
      setPage(loadedPage);
      setHtml(convertedHtml);

      const inlineComments = await getInlineComments(contextInfo.pageId);
      setComments(inlineComments);
      setIsLoading(false);
      
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // After HTML renders, mark blocks that contain inline comments
  useEffect(() => {
    if (!html || isLoading) return;
    // Wait for next frame to ensure DOM is painted
    const timeoutId = setTimeout(() => {
      markCommentedBlocks();
    }, 10);
    return () => clearTimeout(timeoutId);
  }, [html, isLoading]);

  if (error) return <div className="conf-container">❌ {error}</div>;
  if (isLoading || !page) return <div className="conf-container">Loading…</div>;

  return (
    <div className="conf-page-wrapper">
      {/* Left Sidebar - Chart */}
      <aside className="conf-sidebar">
        <div className="conf-chart-section">
          <h2>Comment Thread Activity</h2>
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
          <h1 className="conf-title">{page.title}</h1>
          <div
            className="conf-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
    </div>
  );
}
