import { useEffect } from "react";
import { markCommentedBlocks } from "./utils/htmlProcessing";
import { usePageData } from "./hooks/usePageData";
import { openRovoAgent } from "./utils/rovoAgent";
import CommentRepliesChart from "./components/CommentRepliesChart";
import Heading from "@atlaskit/heading";
import InlineMessage from "@atlaskit/inline-message";
import Spinner from "@atlaskit/spinner";
import { COMMENT_STATUS, UI_LABELS } from "./constants";

export default function App() {
  const { page, html, comments, error, isLoading } = usePageData();

  // Mark block elements containing inline comments after HTML renders
  // Uses requestAnimationFrame to ensure DOM is ready before querying elements
  useEffect(() => {
    if (!html || isLoading) return;
    const rafId = requestAnimationFrame(() => {
      markCommentedBlocks();
    });
    return () => cancelAnimationFrame(rafId);
  }, [html, isLoading]);

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

  const handleOpenRovo = async () => {
    try {
      await openRovoAgent();
    } catch (error) {
      console.error("Failed to open Rovo agent:", error);
    }
  };

  return (
    <div className="conf-page-wrapper">
      <input
        type="checkbox"
        id="conf-sidebar-toggle"
        className="conf-sidebar-checkbox"
        aria-label="Toggle sidebar"
      />
      <label className="conf-sidebar-toggle" htmlFor="conf-sidebar-toggle">
        <span />
        <span />
        <span />
      </label>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button 
              className="rovo-agent-button"
              onClick={handleOpenRovo}
              aria-label="Open AI Assistant"
            >
              AI Assistant
            </button>
            <Heading as="h1" size="xlarge" style={{ margin: 0 }}>
              {page?.title || UI_LABELS.UNTITLED_PAGE}
            </Heading>
          </div>
          <div
            className="conf-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
    </div>
  );
}
