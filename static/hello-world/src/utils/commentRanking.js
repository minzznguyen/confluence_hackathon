/**
 * Comment Ranking Utilities
 * Pure functions for building comment trees and ranking by reply count.
 */

// ============================================
// TREE BUILDING — O(n)
// ============================================

/**
 * Builds a tree structure from flat comment array.
 * Two-pass algorithm: O(n) time, O(n) space.
 * 
 * @param {Array} comments - Flat array from getInlineComments()
 * @returns {{ roots: Array, nodeMap: Map }}
 */
export function buildCommentTree(comments) {
  if (!comments || comments.length === 0) {
    return { roots: [], nodeMap: new Map() };
  }

  const nodeMap = new Map();
  const roots = [];

  // Pass 1: Create all nodes
  for (const comment of comments) {
    nodeMap.set(comment.id, {
      id: comment.id,
      parentCommentId: comment.parentCommentId ?? null,
      authorId: comment.version?.authorId || 'unknown',
      createdAt: comment.version?.createdAt || '',
      body: comment.body,
      resolutionStatus: comment.resolutionStatus || null,
      inlineOriginalSelection: comment.properties?.inlineOriginalSelection || null,
      inlineMarkerRef: comment.properties?.inlineMarkerRef || null,
      webui: comment._links?.webui || null,
      children: [],
      replyCount: 0,
    });
  }

  // Pass 2: Link children to parents
  for (const comment of comments) {
    const node = nodeMap.get(comment.id);

    if (!comment.parentCommentId) {
      // Root/parent comment
      roots.push(node);
    } else {
      // Reply — attach to parent
      const parentNode = nodeMap.get(comment.parentCommentId);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // Orphan (parent not in dataset) — treat as root
        roots.push(node);
      }
    }
  }

  return { roots, nodeMap };
}

// ============================================
// REPLY COUNTING — Recursive
// ============================================

/**
 * Counts all nested replies for a node (recursive).
 * 
 * @param {Object} node - A comment node with children array
 * @returns {number} Total reply count (all depth levels)
 */
export function countReplies(node) {
  if (!node.children || node.children.length === 0) {
    return 0;
  }

  let count = node.children.length;
  for (const child of node.children) {
    count += countReplies(child);
  }
  return count;
}

// ============================================
// RANKING — Main Entry Point
// ============================================

/**
 * Returns parent comments ranked by total reply count (descending).
 * Only includes comments with resolutionStatus === "open".
 * 
 * @param {Array} comments - Flat array from getInlineComments()
 * @param {Object} options - Optional filters
 * @param {string} options.status - Filter by resolutionStatus ("open", "resolved", or "all"). Default: "open"
 * @returns {Array} Sorted array of root comments with replyCount populated
 */
export function rankParentsByReplies(comments, options = {}) {
  if (!comments || comments.length === 0) {
    return [];
  }

  const { status = 'open' } = options;

  const { roots } = buildCommentTree(comments);

  // Filter by resolution status (only parent comments have resolutionStatus)
  let filteredRoots = roots;
  if (status !== 'all') {
    filteredRoots = roots.filter(root => root.resolutionStatus === status);
  }

  // Compute reply count for each root (immutable - create new objects)
  const ranked = filteredRoots.map(root => ({
    ...root,
    replyCount: countReplies(root),
  }));

  // Sort descending by reply count
  ranked.sort((a, b) => b.replyCount - a.replyCount);

  return ranked;
}

// ============================================
// TEXT EXTRACTION — For Labels
// ============================================

/**
 * Extracts preview text from comment body (atlas_doc_format).
 * 
 * @param {Object} body - Comment body object from API
 * @param {number} maxLength - Max characters for preview
 * @returns {string} Truncated text preview
 */
export function extractPreview(body, maxLength = 30) {
  if (!body) return '(No content)';

  try {
    const atlasDoc = body.atlas_doc_format?.value;
    if (!atlasDoc) return '(No content)';

    const parsed = typeof atlasDoc === 'string' ? JSON.parse(atlasDoc) : atlasDoc;

    // Recursively extract text from ADF nodes
    let text = '';
    const extract = (node) => {
      if (node.type === 'text' && node.text) {
        text += node.text;
      }
      if (node.content) {
        node.content.forEach(extract);
      }
    };

    if (parsed.content) {
      parsed.content.forEach(extract);
    }

    text = text.trim();
    if (!text) return '(No content)';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + '…';
  } catch {
    return '(No content)';
  }
}

/**
 * Gets a display label for a comment node.
 * Uses the comment body text (what the reviewer wrote).
 * 
 * @param {Object} node - Comment node from buildCommentTree
 * @param {number} maxLength - Max characters for label
 * @returns {string} Display label
 */
export function getCommentLabel(node, maxLength = 50) {
  // Use the comment body (what the reviewer wrote)
  return extractPreview(node.body, maxLength);
}

/**
 * Gets the highlighted text that the comment is attached to.
 * 
 * @param {Object} node - Comment node from buildCommentTree
 * @param {number} maxLength - Max characters
 * @returns {string} Highlighted text or "(No selection)"
 */
export function getHighlightedText(node, maxLength = 50) {
  if (!node.inlineOriginalSelection) return '(No selection)';
  
  // Type check: ensure it's a string before calling .trim()
  if (typeof node.inlineOriginalSelection !== 'string') return '(No selection)';
  
  const text = node.inlineOriginalSelection.trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}
