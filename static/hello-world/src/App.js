import { usePageData } from "./hooks/usePageData";
import { useCommentPopup } from "./hooks/useCommentPopup";
import CommentRepliesChart from "./components/CommentRepliesChart";
import CommentPopup from "./components/CommentPopup";
import Heading from "@atlaskit/heading";
import InlineMessage from "@atlaskit/inline-message";
import Spinner from "@atlaskit/spinner";
import { COMMENT_STATUS, UI_LABELS } from "./constants";

export default function App() {
  const { page, html, comments, error, isLoading } = usePageData();
  const { popup, onClose, openPopupForMarker } = useCommentPopup(html, isLoading, comments);

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
    <>
      <input
        type="checkbox"
        id="conf-sidebar-toggle"
        className="conf-sidebar-checkbox"
        aria-label="Toggle sidebar"
      />
      <label className="conf-sidebar-toggle" htmlFor="conf-sidebar-toggle">
        <span className="conf-chevron-left">‹</span> 
        <span className="conf-chevron-right">›</span>
      </label>

      <aside className="conf-sidebar">
        <div className="conf-sidebar-spacer"></div>
        <div className="conf-chart-section">
          <Heading as="h2">Comment Thread Activity</Heading>
          <CommentRepliesChart
            comments={comments}
            status={COMMENT_STATUS.OPEN}
            maxItems={20}
            onBarClick={openPopupForMarker}
            isPopupVisible={popup.visible}
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
        y={popup.y}
        comments={popup.comments}
        onClose={onClose}
      />
    </>
  );
}
