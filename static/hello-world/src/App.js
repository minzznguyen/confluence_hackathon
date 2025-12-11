/**
 * Main Application Component
 * Displays a Confluence page with inline comment highlighting.
 */

import { useEffect, useState } from "react";
import { getPageInfo, getInlineComments, getUserInfo } from "./api/confluence";
import { processConfluenceHtml, markCommentedBlocks } from "./utils/htmlProcessing";
import { 
  bindInlineCommentPopup,
  extractCommentText, 
  formatCommentDate, 
  getAvatarUrl 
} from "./utils/helper"
import "./styles/index.css";

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);

  const [popup, setPopup] = useState({
    visible: false,
    x: 0,
    y: 0,
    comments: []
  });

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

  // Load inline comments
  useEffect(() => {
    async function loadComments() {
      try {
        const data = await getInlineComments();
        setComments(data);
      } catch (err) {
        console.error("Failed to load inline comments:", err);
      }
    }

    loadComments();
  }, [page]);

  // Mark commented blocks after HTML renders
  useEffect(() => {
    if (!html) return;

    const timeoutId = setTimeout(markCommentedBlocks, 10);
    return () => clearTimeout(timeoutId);
  }, [html]);

  // Click-based popup for inline comments (fixed to screen)
  useEffect(() => {
    const cleanup = bindInlineCommentPopup(html, comments, setPopup);
    return cleanup;
  }, [html, comments]);

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

      {/* Click Popup */}
      {popup.visible && (
      <div
        className="conf-comment-popup"
        style={{ top: popup.y, left: popup.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="conf-popup-close"
          onClick={() => setPopup((prev) => ({ ...prev, visible: false }))}
        >
          ✕
        </button>

        {popup.comments.map((c) => {
          const text = extractCommentText(c);
          const avatar = getAvatarUrl(c.user);
          const date = formatCommentDate(c.version.createdAt);

          return (
            <div key={c.id} className="conf-comment-item">
              <div className="conf-comment-header">
                <img className="conf-avatar" src={avatar} alt="avatar" />

                <div>
                  <div className="conf-comment-author">{c.user?.displayName}</div>
                  <div className="conf-comment-date">{date}</div>
                </div>
              </div>

              <div className="conf-comment-body">{text}</div>
            </div>
          );
        })}
      </div>
    )}
    </div>
  );
}
