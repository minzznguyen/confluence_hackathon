import { useEffect, useState, useCallback } from "react";
import { view } from "@forge/bridge";
import { navigateToFullPage } from "./utils/navigation";
import { loadPage } from "./utils/pageLoader";
import { loadPageForSpacePage } from "./utils/spacePageLoader";
import "./index.css";

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
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

  if (isNavigating) return <div className="conf-container">Navigating...</div>;
  if (error) return <div className="conf-container">❌ {error}</div>;
  if (isLoading || !page) return <div className="conf-container">Loading…</div>;

  return (
    <div className="conf-container">
      <h1 className="conf-title">{page.title}</h1>
      <div
        className="conf-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
