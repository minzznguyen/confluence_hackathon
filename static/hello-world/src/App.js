import { useEffect, useState } from "react";
import { view } from "@forge/bridge";
import { navigateToFullPage } from "./utils/navigation";
import { loadPage } from "./utils/pageLoader";

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    // Handle navigation for byline/content action modules
    view.getContext().then(async (context) => {
      await navigateToFullPage(context);
    }).catch((err) => {
      console.error('Failed to get context:', err);
    });

    // Load page data for full page module
    async function load() {
      try {
        const { page: loadedPage, html: convertedHtml } = await loadPage();
        setPage(loadedPage);
        setHtml(convertedHtml);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    }

    load();
  }, [window.location.href]); // Re-run when URL changes to load new page data

  if (error) return <p className="error-message">Error: {error}</p>;
  if (!page) return <p className="loading-message">Loading page…</p>;

  return (
    <div className="page-container">

      {/* Title */}
      <h1 className="page-title">{page.title}</h1>

      {/* Body Content */}
      <div
        className="confluence-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <style>{`
        .error-message,
        .loading-message {
          padding: 20px;
        }

        .page-container {
          max-width: 820px;
          margin: 0 auto;
          padding: 40px 24px;
          font-family: Inter, Arial, sans-serif;
          line-height: 1.6;
          color: #172B4D;
        }

        .page-title {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .confluence-body {
          font-size: 16px;
        }

        .confluence-body h1 {
          font-size: 26px;
          margin-top: 42px;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .confluence-body p {
          margin-bottom: 16px;
        }

        .confluence-body img {
          border-radius: 8px;
          max-width: 100%;
        }
      `}</style>
    </div>
  );
}
