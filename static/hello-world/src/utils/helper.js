// Convert Confluence inline comment markers to spans for DOM manipulation.
// Confluence stores commented regions in <ac:inline-comment-marker> tags in the storage format.
export function wrapInlineCommentMarkers(html) {
  if (!html) return "";

  return html.replace(
    /<ac:inline-comment-marker\b[^>]*>([\s\S]*?)<\/ac:inline-comment-marker>/g,
    '<span class="conf-inline-comment">$1</span>'
  );
}

// Convert only images; DO NOT touch inline styling
export function convertImages(html, pageId) {
  if (!html) return "";

  return html.replace(/<ac:image[^>]*>([\s\S]*?)<\/ac:image>/g, (_, inner) => {
    const match = inner.match(/ri:filename="([^"]+)"/);
    if (!match) return "";

    const filename = match[1];
    const url = `${BASE_URL}/wiki/download/attachments/${pageId}/${filename}?api=v2`;

    return `<img src="${url}" class="conf-img" />`;
  });
}