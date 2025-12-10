/**
 * Main Application Component
 * Displays a Confluence page with inline comment highlighting.
 */

import { useEffect, useState } from "react";
import { getPageInfo } from "./api/confluence";
import { processConfluenceHtml, markCommentedBlocks } from "./utils/htmlProcessing";
import "./styles/index.css";

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");

  // Load page data on mount
  useEffect(() => {
    async function loadPageData() {
      try {
        const pageData = await getPageInfo();
        const rawStorageHtml = pageData.body.storage.value;
        const processedHtml = processConfluenceHtml(rawStorageHtml, pageData.id);

        setPage(pageData);
        setHtml(processedHtml);
      } catch (err) {
        setError(err.message);
      }
    }
    
    loadPageData();
  }, []);

  // Mark commented blocks after HTML renders
  useEffect(() => {
    if (!html) return;

    const timeoutId = setTimeout(markCommentedBlocks, 10);
    return () => clearTimeout(timeoutId);
  }, [html]);

  if (error) {
    return <div className="conf-error">❌ {error}</div>;
  }

  if (!page) {
    return <div className="conf-loading">Loading…</div>;
  }

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
