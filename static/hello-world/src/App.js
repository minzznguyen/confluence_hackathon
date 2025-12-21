import { usePageData } from "./hooks/usePageData";
import { useCommentPopup } from "./hooks/useCommentPopup";
import CommentActivitySidebar from "./components/CommentActivitySidebar";
import CommentPopup from "./components/CommentPopup";
import Heading from "@atlaskit/heading";
import InlineMessage from "@atlaskit/inline-message";
import Spinner from "@atlaskit/spinner";
import { UI_LABELS } from "./constants";

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
      <CommentActivitySidebar
        comments={comments}
        onBarClick={openPopupForMarker}
      />

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
