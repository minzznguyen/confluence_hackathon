import { useEffect, useState } from "react";
import { getPageInfo } from "./api";
import "./index.css";

const BASE_URL = "https://atlassianhackathon2025.atlassian.net";

// Convert Confluence inline comment markers to spans for DOM manipulation.
// Confluence stores commented regions in <ac:inline-comment-marker> tags in the storage format.
function wrapInlineCommentMarkers(html) {
  if (!html) return "";

  return html.replace(
    /<ac:inline-comment-marker\b[^>]*>([\s\S]*?)<\/ac:inline-comment-marker>/g,
    '<span class="conf-inline-comment">$1</span>'
  );
}

// Convert only images; DO NOT touch inline styling
function convertImages(html, pageId) {
  if (!html) return "";

  return html.replace(/<ac:image[^>]*>([\s\S]*?)<\/ac:image>/g, (_, inner) => {
    const match = inner.match(/ri:filename="([^"]+)"/);
    if (!match) return "";

    const filename = match[1];
    const url = `${BASE_URL}/wiki/download/attachments/${pageId}/${filename}?api=v2`;

    return `<img src="${url}" class="conf-img" />`;
  });
}

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const page = await getPageInfo();
        const raw = page.body.storage.value;

        // First, wrap inline comment markers with spans for later processing.
        const withWrappedComments = wrapInlineCommentMarkers(raw);

        // Then, convert any Confluence image macros into direct <img> tags.
        const cleaned = convertImages(withWrappedComments, page.id);

        setPage(page);
        setHtml(cleaned);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  // After the HTML is rendered, highlight parent blocks that contain inline comments
  useEffect(() => {
    if (!html) return;

    // Mark block elements that contain inline comments with a visual indicator
    function markCommentedBlocks() {
      const commentSpans = document.querySelectorAll('.conf-inline-comment');
      
      commentSpans.forEach(span => {
        // Find the closest block-level parent (p, div, li, h1-h6, td, th, etc.)
        let parent = span.closest('p, div, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, pre, section, article, dt, dd, figcaption, figure');
        
        // Add class to mark the block as containing a comment (visual indicator only)
        if (parent && !parent.classList.contains('conf-has-comment')) {
          parent.classList.add('conf-has-comment');
        }
      });
    }

    // Small delay to ensure DOM is fully rendered before marking blocks
    setTimeout(markCommentedBlocks, 10);
  }, [html]);

  if (error) return <div className="conf-error">❌ {error}</div>;
  if (!page) return <div className="conf-loading">Loading…</div>;

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
