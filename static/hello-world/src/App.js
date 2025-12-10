import { useEffect, useState, useCallback } from "react";
import { view } from "@forge/bridge";
import { navigateToFullPage } from "./utils/navigation";
import { loadPage } from "./utils/pageLoader";
import { loadPageForSpacePage } from "./utils/spacePageLoader";
import "./App.css";

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleType, setModuleType] = useState(null);

  /**
   * Load page data based on module type.
   */
  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const context = await view.getContext();
      const type = context.extension?.type;
      setModuleType(type);

      // Handle navigation modules (byline/content action) - opens full page in new tab
      if (type === 'confluence:contentBylineItem' || 
          type === 'confluence:contentAction') {
        setIsNavigating(true);
        await navigateToFullPage(context);
        return;
      }

      // Handle space page
      if (type === 'confluence:spacePage') {
        const { page: loadedPage, html: convertedHtml } = await loadPageForSpacePage(context);
        setPage(loadedPage);
        setHtml(convertedHtml);
        setIsLoading(false);
        return;
      }

      // Handle full page and global settings
      const { page: loadedPage, html: convertedHtml } = await loadPage();
      setPage(loadedPage);
      setHtml(convertedHtml);
      setIsLoading(false);
      
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  if (isNavigating) return <p className="loading-message">Navigating...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;
  if (isLoading || !page) return <p className="loading-message">Loading page…</p>;

  return (
    <div className="page-container">
      {moduleType === 'confluence:spacePage' && (
        <button 
          className="refresh-button"
          onClick={() => loadPageData()}
          title="Refresh to load the most recently viewed page"
        >
          🔄 Refresh
        </button>
      )}

      <h1 className="page-title">{page.title}</h1>

      <div
        className="confluence-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
