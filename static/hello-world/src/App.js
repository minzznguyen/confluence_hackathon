import { useEffect } from "react";
import { markCommentedBlocks } from "./utils/htmlProcessing";
import { usePageData } from "./hooks/usePageData";
import CommentRepliesChart from "./components/CommentRepliesChart";
import Heading from "@atlaskit/heading";
import InlineMessage from "@atlaskit/inline-message";
import Spinner from "@atlaskit/spinner";
import { COMMENT_STATUS, UI_LABELS } from "./constants";
import { rovo } from "@forge/bridge";

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
      <button
        onClick={async () => {
          const test = await rovo.open({
            type: "forge",
            agentName: "My Hello World agent",
            agentKey: "hello-world-agent",
            prompt: `Testing Rovo on page: ${page.title}`,
          });
          console.log("Thao Testing:", test);
        }}
      >
        Open Thao Testing Rovo
      </button>

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
    </div>
  );
}
