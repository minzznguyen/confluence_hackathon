import { COMMENT_STATUS } from '../constants';

/**
 * @typedef {Object} CommentNode
 * @property {string} id
 * @property {Object} body
 * @property {string|null} resolutionStatus
 * @property {string|null} inlineMarkerRef
 * @property {string|null} inlineOriginalSelection
 * @property {string|null} authorId
 * @property {CommentNode[]} children
 * 
 * @typedef {Object} CommentTree
 * @property {CommentNode[]} roots
 */

/**
 * Builds a tree structure from a flat array of comments.
 * 
 * By default, only includes essential fields: id, body, resolutionStatus, inlineMarkerRef, 
 * inlineOriginalSelection, authorId, and children. Use transformNode to include additional fields.
 * 
 * @param {Array<Object>} comments - Flat array from API. Each comment has id, optional parentCommentId, body, resolutionStatus, version.authorId, and properties.{inlineMarkerRef, inlineOriginalSelection}
 * @param {Function} [transformNode] - Optional function to transform each node. If provided, receives (comment, baseNode) and returns the transformed node. If not provided, returns baseNode with only essential fields.
 * @returns {CommentTree} Tree with roots array of top-level nodes
 * 
 * @example
 * buildCommentTree([
 *   { id: '1', resolutionStatus: 'open', version: { authorId: 'user1' } },
 *   { id: '2', parentCommentId: '1', resolutionStatus: 'open', version: { authorId: 'user2' } }
 * ]);
 * // Returns: { roots: [{ id: '1', authorId: 'user1', children: [{ id: '2', authorId: 'user2', children: [] }] }] }
 * 
 * @example
 * buildCommentTree(comments, (comment, baseNode) => ({
 *   ...comment,
 *   ...baseNode,
 *   children: []
 * }));
 */
export function buildCommentTree(comments, transformNode = null) {
  if (!comments || comments.length === 0) {
    return { roots: [] };
  }

  const nodeMap = new Map();
  const roots = [];

  for (const comment of comments) {
    let node;
    
    // Create base node with only essential fields
    const baseNode = {
      id: comment.id,
      body: comment.body,
      resolutionStatus: comment.resolutionStatus || null,
      inlineMarkerRef: comment.properties?.inlineMarkerRef || null,
      inlineOriginalSelection: comment.properties?.inlineOriginalSelection || null,
      authorId: comment.version?.authorId || null,
      children: [],
    };

    // Apply transform if provided, otherwise use base node as-is
    node = transformNode ? transformNode(comment, baseNode) : baseNode;
    
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
 * Recursively collects all unique author IDs from a comment thread (including the parent and all replies).
 * 
 * @param {CommentNode} node - Comment node with children array and authorId
 * @returns {Set<string>} Set of unique author IDs in the thread
 * 
 * @example
 * countParticipants({ 
 *   id: '1', 
 *   authorId: 'user1',
 *   children: [
 *     { id: '2', authorId: 'user2', children: [] },
 *     { id: '3', authorId: 'user1', children: [] }
 *   ]
 * }); // Returns Set(['user1', 'user2'])
 */
function collectParticipants(node) {
  const participants = new Set();
  
  // Add the current node's author if it exists
  if (node.authorId) {
    participants.add(node.authorId);
  }
  
  // Recursively collect participants from all children
  if (node.children?.length) {
    node.children.forEach(child => {
      const childParticipants = collectParticipants(child);
      childParticipants.forEach(id => participants.add(id));
    });
  }
  
  return participants;
}

/**
 * Returns parent comments ranked by thread size (descending).
 * Thread size = 1 (parent) + number of replies.
 * Filters by status before ranking.
 * Also calculates the number of unique participants (authors) in each thread.
 * 
 * @param {Array<Object>} comments - Flat array from API
 * @param {Object} [options={}]
 * @param {string} [options.status=COMMENT_STATUS.OPEN] - Filter by status
 * @returns {Array<CommentNode & { threadCount: number, participantCount: number }>} Root comments sorted by threadCount (descending)
 * 
 * @example
 * rankParentsByReplies([
 *   { id: '1', resolutionStatus: 'open', version: { authorId: 'user1' } },
 *   { id: '2', parentCommentId: '1', resolutionStatus: 'open', version: { authorId: 'user2' } },
 *   { id: '3', parentCommentId: '1', resolutionStatus: 'open', version: { authorId: 'user1' } },
 *   { id: '4', resolutionStatus: 'open', version: { authorId: 'user3' } }
 * ]);
 * // Returns: [{ id: '1', threadCount: 3, participantCount: 2, ... }, { id: '4', threadCount: 1, participantCount: 1, ... }]
 */
export function rankParentsByReplies(comments, options = {}) {
  if (!comments?.length) return [];

  const { status = COMMENT_STATUS.OPEN } = options;
  const { roots } = buildCommentTree(comments);

  const filtered = roots.filter(r => r.resolutionStatus === status);

  return filtered
    .map(root => {
      const threadCount = 1 + countReplies(root);
      const participants = collectParticipants(root);
      return { 
        ...root, 
        threadCount,
        participantCount: participants.size
      };
    })
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

/**
 * @typedef {Object} UserCommentCount
 * @property {string} authorId - User's account ID
 * @property {number} commentCount - Total number of comments by this user
 * @property {string|null} displayName - User's display name (null until enriched)
 */

/**
 * Groups comments by author and returns a sorted array of user comment counts.
 * Counts all comments (both parent and replies) per user.
 * 
 * @param {Array<Object>} comments - Flat array of comments from API
 * @param {Object} [options={}]
 * @param {string} [options.status=COMMENT_STATUS.OPEN] - Filter by resolution status
 * @returns {Array<UserCommentCount>} Array sorted by commentCount (descending)
 * 
 * @example
 * groupCommentsByUser([
 *   { id: '1', resolutionStatus: 'open', version: { authorId: 'user1' } },
 *   { id: '2', resolutionStatus: 'open', version: { authorId: 'user2' } },
 *   { id: '3', resolutionStatus: 'open', version: { authorId: 'user1' } },
 * ]);
 * // Returns: [
 * //   { authorId: 'user1', commentCount: 2, displayName: null },
 * //   { authorId: 'user2', commentCount: 1, displayName: null }
 * // ]
 */
export function groupCommentsByUser(comments, options = {}) {
  if (!comments?.length) return [];

  const { status = COMMENT_STATUS.OPEN } = options;

  // Filter comments by status (for replies, check parent's status via the tree)
  const { roots } = buildCommentTree(comments);
  const openRootIds = new Set(
    roots.filter(r => r.resolutionStatus === status).map(r => r.id)
  );

  // Collect all comment IDs that belong to open threads
  const openCommentIds = new Set();
  const collectOpenIds = (node) => {
    openCommentIds.add(node.id);
    node.children?.forEach(collectOpenIds);
  };
  roots.filter(r => openRootIds.has(r.id)).forEach(collectOpenIds);

  // Group by author, only counting comments in open threads
  const userCounts = new Map();

  for (const comment of comments) {
    if (!openCommentIds.has(comment.id)) continue;

    const authorId = comment.version?.authorId;
    if (!authorId) continue;

    const current = userCounts.get(authorId) || { authorId, commentCount: 0, displayName: null };
    current.commentCount += 1;
    userCounts.set(authorId, current);
  }

  // Convert to array and sort by comment count (descending)
  return Array.from(userCounts.values()).sort((a, b) => b.commentCount - a.commentCount);
}
