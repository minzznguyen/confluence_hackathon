import { useEffect, useState, useCallback } from "react";
import { view } from "@forge/bridge";
import { navigateToFullPage } from "./utils/navigation";
import { loadPage } from "./utils/pageLoader";
import { loadPageForSpacePage } from "./utils/spacePageLoader";
// Import external CSS - Forge CSP blocks inline styles
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
   * This is extracted as a callback so it can be called on mount AND on refresh.
   */
  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const context = await view.getContext();
      const type = context.extension?.type;
      setModuleType(type);

      console.log('%c 🔄 APP: Loading page data... ', 'background: #0052CC; color: white;');
      console.log(`   Module type: ${type}`);

      // Handle navigation modules (byline/content action) - opens full page in new tab
      if (type === 'confluence:contentBylineItem' || 
          type === 'confluence:contentAction') {
        setIsNavigating(true);
        await navigateToFullPage(context);
        return; // Stop here, navigation will open new tab
      }

      // Handle space page - ALWAYS fetch fresh from storage
      // This ensures we show the most recently tracked page
      if (type === 'confluence:spacePage') {
        console.log('%c 📍 SPACE PAGE: Fetching fresh data from storage ', 'background: #6554C0; color: white;');
        const { page: loadedPage, html: convertedHtml } = await loadPageForSpacePage(context);
        setPage(loadedPage);
        setHtml(convertedHtml);
        setIsLoading(false);
        return;
      }

      // Handle full page and global settings - normal load
      const { page: loadedPage, html: convertedHtml } = await loadPage();
      setPage(loadedPage);
      setHtml(convertedHtml);
      setIsLoading(false);
      
    } catch (err) {
      console.error(err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  // Run on initial mount - empty dependency array ensures fresh load every time
  // the iframe is created (which happens when navigating to the space page)
  useEffect(() => {
    console.log('%c 🚀 APP: Component mounted - initializing... ', 'background: #00875A; color: white;');
    loadPageData();
  }, [loadPageData]);

  // Show "Navigating..." while byline/content action opens new tab
  if (isNavigating) return <p className="loading-message">Navigating...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;
  if (isLoading || !page) return <p className="loading-message">Loading page…</p>;

  return (
    <div className="page-container">
      {/* Refresh button for space page - allows manual refresh to get latest tracked page */}
      {moduleType === 'confluence:spacePage' && (
        <button 
          className="refresh-button"
          onClick={() => {
            console.log('%c 🔄 USER: Manual refresh requested ', 'background: #FFAB00; color: black;');
            loadPageData();
          }}
          title="Refresh to load the most recently viewed page"
        >
          🔄 Refresh
        </button>
      )}

      {/* Title */}
      <h1 className="page-title">{page.title}</h1>

      {/* Body Content */}
      <div
        className="confluence-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
