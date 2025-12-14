import { extractCommentText, formatCommentDate, getAvatarUrl } from "../utils/fullpageProcessing";
import { buildCommentTree } from "../utils/commentRanking";
import Button from '@atlaskit/button/new';
import "../styles/comments.css";

/**
 * Recursively renders a comment and its replies.
 * 
 * @param {Object} comment - Comment node with potential children
 * @param {number} depth - Current nesting depth (for styling)
 * @param {boolean} showCloseButton - Whether to show the close button in this header
 * @param {Function} onClose - Callback function to close the popup
 * @returns {JSX.Element} Rendered comment with nested replies
 */
function CommentItem({ comment, depth = 0, showCloseButton = false, onClose }) {
  const user = comment?.user;
  const text = extractCommentText(comment);
  const createdAt = comment?.version?.createdAt || comment?.createdAt;
  const date = formatCommentDate(createdAt);
  const avatarUrl = getAvatarUrl(user);
  const hasReplies = comment?.children && comment.children.length > 0;

  return (
    <div className={`conf-popup-comment ${depth > 0 ? 'conf-popup-comment-reply' : ''}`}>
      <div className="conf-popup-comment-header">
        <img
          src={avatarUrl}
          alt={user?.displayName || "User"}
          className="conf-popup-avatar"
        />
        <div className="conf-popup-user-info">
          <div className="conf-popup-user-name-wrapper">
            <div className="conf-popup-user-name">
              {user?.displayName || "Unknown User"}
            </div>
            {showCloseButton && (
              <Button
                appearance="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClose) onClose();
                }}
                aria-label="Close comments"
                className="conf-popup-close"
              >
                ×
              </Button>
            )}
          </div>
          {date && (
            <div className="conf-popup-date">{date}</div>
          )}
        </div>
      </div>
      <div className="conf-popup-comment-text">{text}</div>
      
      {/* Render replies recursively */}
      {hasReplies && (
        <div className="conf-popup-replies">
          {comment.children.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              showCloseButton={false}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentPopup({ visible, x, y, comments = [], onClose }) {
  if (!visible || !comments || comments.length === 0) {
    return null;
  }

  // Build comment tree structure to show replies with all enriched data preserved
  // Use buildCommentTree but preserve all fields including user, version, etc.
  const { roots } = buildCommentTree(comments, (comment) => ({
    ...comment, // Preserve all fields including user, version, etc.
    children: [],
  }));

  return (
    <div
      className="conf-comment-popup"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="conf-popup-content">
        {roots.map((comment, index) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            depth={0}
            showCloseButton={index === 0}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
}

