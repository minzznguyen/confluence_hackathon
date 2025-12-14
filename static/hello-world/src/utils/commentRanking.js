import { COMMENT_STATUS } from '../constants';

/**
 * @typedef {Object} CommentNode
 * @property {string} id
 * @property {Object} body
 * @property {string|null} resolutionStatus
 * @property {string|null} inlineMarkerRef
 * @property {string|null} inlineOriginalSelection
 * @property {CommentNode[]} children
 * 
 * @typedef {Object} CommentTree
 * @property {CommentNode[]} roots
 */

/**
 * Builds a tree structure from a flat array of comments.
 * 
 * @param {Array<Object>} comments - Flat array from API. Each comment has id, optional parentCommentId, body, resolutionStatus, and properties.{inlineMarkerRef, inlineOriginalSelection}
 * @param {Function} [transformNode] - Optional function to transform each node. If provided, receives (comment, node) and returns the transformed node.
 * @returns {CommentTree} Tree with roots array of top-level nodes
 * 
 * @example
 * buildCommentTree([
 *   { id: '1', resolutionStatus: 'open' },
 *   { id: '2', parentCommentId: '1', resolutionStatus: 'open' }
 * ]);
 * // Returns: { roots: [{ id: '1', children: [{ id: '2', children: [] }] }] }
 */
export function buildCommentTree(comments, transformNode = null) {
  if (!comments || comments.length === 0) {
    return { roots: [] };
  }

  const nodeMap = new Map();
  const roots = [];

  for (const comment of comments) {
    let node;
    
    // Apply transform if provided
    if (transformNode) {
      const baseNode = {
        id: comment.id,
        body: comment.body,
        resolutionStatus: comment.resolutionStatus || null,
        inlineMarkerRef: comment.properties?.inlineMarkerRef || null,
        inlineOriginalSelection: comment.properties?.inlineOriginalSelection || null,
        children: [],
      };
      node = transformNode(comment, baseNode);
    } else {
      // Default: preserve all comment fields and extract inlineMarkerRef to root level
      node = {
        ...comment,
        inlineMarkerRef: comment.properties?.inlineMarkerRef || null,
        inlineOriginalSelection: comment.properties?.inlineOriginalSelection || null,
        children: [],
      };
    }
    
    nodeMap.set(comment.id, node);
  }

  for (const comment of comments) {
    const node = nodeMap.get(comment.id);
    if (!comment.parentCommentId) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(comment.parentCommentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return { roots };
}

/**
 * Recursively counts all nested replies for a comment node (including grandchildren).
 * 
 * @param {CommentNode} node - Comment node with children array
 * @returns {number} Total count of all nested replies
 * 
 * @example
 * countReplies({ id: '1', children: [
 *   { id: '2', children: [{ id: '4', children: [] }] },
 *   { id: '3', children: [] }
 * ]}); // Returns 3 (2 direct + 1 grandchild)
 */
function countReplies(node) {
  if (!node.children?.length) return 0;
  return node.children.reduce((sum, child) => sum + 1 + countReplies(child), 0);
}

/**
 * Returns parent comments ranked by thread size (descending).
 * Thread size = 1 (parent) + number of replies.
 * Filters by status before ranking.
 * 
 * @param {Array<Object>} comments - Flat array from API
 * @param {Object} [options={}]
 * @param {string} [options.status=COMMENT_STATUS.OPEN] - Filter by status
 * @returns {Array<CommentNode & { threadCount: number }>} Root comments sorted by threadCount (descending)
 * 
 * @example
 * rankParentsByReplies([
 *   { id: '1', resolutionStatus: 'open' },
 *   { id: '2', parentCommentId: '1', resolutionStatus: 'open' },
 *   { id: '3', parentCommentId: '1', resolutionStatus: 'open' },
 *   { id: '4', resolutionStatus: 'open' }
 * ]);
 * // Returns: [{ id: '1', threadCount: 3, ... }, { id: '4', threadCount: 1, ... }]
 */
export function rankParentsByReplies(comments, options = {}) {
  if (!comments?.length) return [];

  const { status = COMMENT_STATUS.OPEN } = options;
  const { roots } = buildCommentTree(comments);

  const filtered = roots.filter(r => r.resolutionStatus === status);

  return filtered
    .map(root => ({ ...root, threadCount: 1 + countReplies(root) }))
    .sort((a, b) => b.threadCount - a.threadCount);
}

/**
 * Extracts preview text from comment body in atlas_doc_format.
 * Recursively traverses document structure to extract all text content.
 * 
 * @param {Object} body - Body with atlas_doc_format.value (JSON string or object)
 * @param {number} [maxLength=30] - Max length before truncation with ellipsis
 * @returns {string} Extracted text or '(No content)' if empty/invalid
 * 
 * @example
 * extractPreview({ atlas_doc_format: { value: JSON.stringify({
 *   content: [{ content: [{ type: 'text', text: 'Great comment!' }] }]
 * }) } }, 10); // Returns 'Great com…'
 */
function extractPreview(body, maxLength = 30) {
  if (!body) return '(No content)';

  try {
    const atlasDoc = body.atlas_doc_format?.value;
    if (!atlasDoc) return '(No content)';

    const parsed = typeof atlasDoc === 'string' ? JSON.parse(atlasDoc) : atlasDoc;
    let text = '';
    
    const extract = (node) => {
      if (node.type === 'text' && node.text) text += node.text;
      if (node.content) node.content.forEach(extract);
    };

    if (parsed.content) parsed.content.forEach(extract);

    text = text.trim();
    if (!text) return '(No content)';
    return text.length <= maxLength ? text : text.slice(0, maxLength - 1) + '…';
  } catch {
    return '(No content)';
  }
}

/**
 * Gets display label using the highlighted/selected text (what user selected when creating comment).
 * 
 * @param {CommentNode} node - Node with inlineOriginalSelection property
 * @param {number} [maxLength=50] - Max length before truncation with ellipsis
 * @returns {string} Selected text or '(No selection)' if missing/invalid
 * 
 * @example
 * getCommentLabel({ inlineOriginalSelection: 'Selected text here' }, 10); // Returns 'Selected t…'
 */
export function getCommentLabel(node, maxLength = 50) {
  const text = node.inlineOriginalSelection;
  if (!text || typeof text !== 'string') return '(No selection)';
  const trimmed = text.trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength - 1) + '…';
}

/**
 * Gets the comment body text (what the reviewer wrote).
 * Extracts preview from body using extractPreview.
 * 
 * @param {CommentNode} node - Node with body property
 * @param {number} [maxLength=50] - Max length before truncation with ellipsis
 * @returns {string} Comment body preview or '(No content)' if empty/invalid
 * 
 * @example
 * getCommentBody({ body: { atlas_doc_format: { value: '...' } } }, 10); // Returns preview text
 */
export function getCommentBody(node, maxLength = 50) {
  return extractPreview(node.body, maxLength);
}
