import { useState, useCallback, useEffect, useRef } from "react";
import { formatCommentDate, getAvatarUrl } from "../utils/commentPopup";
import { buildCommentTree, getCommentBody } from "../utils/commentRanking";
import Button from '@atlaskit/button/new';
import PropTypes from 'prop-types';
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
  const text = getCommentBody(comment, Infinity);
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

export default function CommentPopup({ visible, y, comments = [], onClose }) {
  // Drag state - offset from initial position
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 });

  // Reset drag offset when popup changes (new comment selected)
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
  }, [comments]);

  const handleMouseDown = useCallback((e) => {
    // Only start drag on left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    // Store initial mouse position and current offset
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
  }, [dragOffset]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;
    
    setDragOffset({
      x: dragStartRef.current.offsetX + deltaX,
      y: dragStartRef.current.offsetY + deltaY,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
      className={`conf-comment-popup ${isDragging ? 'conf-popup-dragging' : ''}`}
      style={{
        top: `${y + dragOffset.y}px`,
        right: `calc(var(--conf-popup-right-margin, 56px) - ${dragOffset.x}px)`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Drag handle header */}
      <div 
        className="conf-popup-drag-handle"
        onMouseDown={handleMouseDown}
        role="button"
        aria-label="Drag to reposition popup"
        tabIndex={0}
      >
        <span className="conf-popup-drag-icon" aria-hidden="true">⋮⋮</span>
      </div>
      
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

CommentPopup.propTypes = {
  visible: PropTypes.bool.isRequired,
  y: PropTypes.number.isRequired,
  comments: PropTypes.arrayOf(PropTypes.object),
  onClose: PropTypes.func,
};

