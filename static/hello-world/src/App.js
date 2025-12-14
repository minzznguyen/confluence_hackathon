import { useEffect, useState, useRef } from "react";
import { markCommentedBlocks } from "./utils/htmlProcessing";
import { bindInlineCommentPopup } from "./utils/fullpageProcessing";
import { usePageData } from "./hooks/usePageData";
import CommentRepliesChart from "./components/CommentRepliesChart";
import CommentPopup from "./components/CommentPopup";
import Heading from "@atlaskit/heading";
import InlineMessage from "@atlaskit/inline-message";
import Spinner from "@atlaskit/spinner";
import { COMMENT_STATUS, UI_LABELS } from "./constants";

export default function App() {
  const { page, html, comments, error, isLoading } = usePageData();
  const [popup, setPopup] = useState({
    visible: false,
    x: 0,
    y: 0,
    comments: [],
    markerRef: null, // Track which marker is currently open
  });

  // Use ref to track current popup state for synchronous access
  const popupRef = useRef(popup);
  popupRef.current = popup;

  // Mark block elements containing inline comments after HTML renders
  // Uses requestAnimationFrame to ensure DOM is ready before querying elements
  useEffect(() => {
    if (!html || isLoading) return;
    const rafId = requestAnimationFrame(() => {
      markCommentedBlocks();
    });
    return () => cancelAnimationFrame(rafId);
  }, [html, isLoading]);

  // Bind click listeners to inline comment markers to open popup
  useEffect(() => {
    if (!html || isLoading || comments.length === 0) return;

    let cleanup = null;
    let isMounted = true;
    
    // Function to get current popup state from ref (synchronous access)
    const getCurrentPopup = () => popupRef.current;
    
    // Wait for DOM to be ready before binding listeners
    const rafId = requestAnimationFrame(() => {
      if (isMounted) {
        cleanup = bindInlineCommentPopup(html, comments, setPopup, getCurrentPopup);
      }
    });

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      // Call cleanup function to remove event listeners
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [html, isLoading, comments]);

  if (error) {
    return (
      <div className="conf-container">
        <InlineMessage type="error" title="Error loading page">
          {error}
        </InlineMessage>
      </div>
    );
  }

  if (isLoading || !page) {
    return (
      <div className="conf-container conf-loading-container">
        <Spinner size="medium" />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="conf-page-wrapper">
      <aside className="conf-sidebar">
        <div className="conf-chart-section">
          <Heading as="h2">Comment Thread Activity</Heading>
          <CommentRepliesChart
            comments={comments}
            status={COMMENT_STATUS.OPEN}
            maxItems={20}
          />
        </div>
      </aside>

      <main className="conf-main">
        <div className="conf-container">
          <Heading as="h1" size="xlarge">
            {page?.title || UI_LABELS.UNTITLED_PAGE}
          </Heading>
          <div
            className="conf-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>

      <CommentPopup
        visible={popup.visible}
        x={popup.x}
        y={popup.y}
        comments={popup.comments}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false, markerRef: null }))}
      />
    </div>
  );
}
