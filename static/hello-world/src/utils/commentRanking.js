// Builds a tree structure from flat comment array
function buildCommentTree(comments) {
  if (!comments || comments.length === 0) {
    return { roots: [] };
  }

  const nodeMap = new Map();
  const roots = [];

  for (const comment of comments) {
    nodeMap.set(comment.id, {
      id: comment.id,
      body: comment.body,
      resolutionStatus: comment.resolutionStatus || null,
      inlineMarkerRef: comment.properties?.inlineMarkerRef || null,
      children: [],
    });
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

// Counts all nested replies for a node
function countReplies(node) {
  if (!node.children?.length) return 0;
  return node.children.reduce((sum, child) => sum + 1 + countReplies(child), 0);
}

// Returns parent comments ranked by reply count (descending)
export function rankParentsByReplies(comments, options = {}) {
  if (!comments?.length) return [];

  const { status = 'open' } = options;
  const { roots } = buildCommentTree(comments);

  const filtered = status === 'all' 
    ? roots 
    : roots.filter(r => r.resolutionStatus === status);

  return filtered
    .map(root => ({ ...root, replyCount: countReplies(root) }))
    .sort((a, b) => b.replyCount - a.replyCount);
}

// Extracts preview text from comment body (atlas_doc_format)
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

// Gets display label for a comment node
export function getCommentLabel(node, maxLength = 50) {
  return extractPreview(node.body, maxLength);
}
