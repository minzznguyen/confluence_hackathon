// Builds a tree structure from flat comment array (O(n) time/space)
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

// Counts all nested replies for a node (recursive)
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

// Returns parent comments ranked by reply count (descending)
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

// Extracts preview text from comment body (atlas_doc_format)
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

// Gets display label for a comment node
export function getCommentLabel(node, maxLength = 50) {
  return extractPreview(node.body, maxLength);
}

// Gets the highlighted text that the comment is attached to
export function getHighlightedText(node, maxLength = 50) {
  if (!node.inlineOriginalSelection || typeof node.inlineOriginalSelection !== 'string') {
    return '(No selection)';
  }
  const text = node.inlineOriginalSelection.trim();
  return text.length <= maxLength ? text : text.slice(0, maxLength - 1) + '…';
}
