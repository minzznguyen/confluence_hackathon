import { useEffect } from "react";
import { markCommentedBlocks } from "./utils/htmlProcessing";
import { usePageData } from "./hooks/usePageData";
import CommentRepliesChart from "./components/CommentRepliesChart";
import Heading from "@atlaskit/heading";
import InlineMessage from "@atlaskit/inline-message";
import Spinner from "@atlaskit/spinner";
import { COMMENT_STATUS } from "./constants";

export default function App() {
  const { page, html, comments, error, isLoading } = usePageData();

  // After HTML renders, mark blocks that contain inline comments
  useEffect(() => {
    if (!html || isLoading) return;
    // Use requestAnimationFrame for better performance than setTimeout
    const rafId = requestAnimationFrame(() => {
      markCommentedBlocks();
    });
    return () => cancelAnimationFrame(rafId);
  }, [html, isLoading]);

  if (error) {
    return (
      <div className="conf-container">
        <InlineMessage
          type="error"
          title="Error loading page"
        >
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
      {/* Left Sidebar - Chart */}
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

      {/* Main Content */}
      <main className="conf-main">
        <div className="conf-container">
          <Heading as="h1" size="xlarge">{page?.title || 'Untitled Page'}</Heading>
          <div
            className="conf-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
    </div>
  );
}
