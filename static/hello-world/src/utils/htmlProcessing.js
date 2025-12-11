/**
 * HTML Processing Utilities
 * Transforms Confluence storage format into renderable HTML.
 */

import { API_ENDPOINTS } from '../constants';

/**
 * Converts <ac:inline-comment-marker> tags to styled <span> elements.
 */
export function wrapInlineCommentMarkers(html) {
  if (!html) return "";

  return html.replace(
    /<ac:inline-comment-marker\b[^>]*>([\s\S]*?)<\/ac:inline-comment-marker>/g,
    '<span class="conf-inline-comment">$1</span>'
  );
}

/**
 * Converts <ac:image> macros to standard <img> tags with attachment URLs.
 */
export function convertImages(html, pageId, baseUrl) {
  if (!html) return "";

  return html.replace(/<ac:image[^>]*>([\s\S]*?)<\/ac:image>/g, (fullMatch, innerContent) => {
    const filenameMatch = innerContent.match(/ri:filename="([^"]+)"/);
    if (!filenameMatch) return "";

    const filename = filenameMatch[1];
    const imageUrl = API_ENDPOINTS.ATTACHMENT(baseUrl, pageId, filename);

    return `<img src="${imageUrl}" class="conf-img" alt="${filename}" />`;
  });
}

/**
 * Main entry point: processes raw Confluence HTML for browser rendering.
 * Order matters: comments first, then images.
 */
export function processConfluenceHtml(rawHtml, pageId, baseUrl) {
  const withCommentSpans = wrapInlineCommentMarkers(rawHtml);
  const withImages = convertImages(withCommentSpans, pageId, baseUrl);
  return withImages;
}

/**
 * Adds visual indicator class to block elements containing inline comments.
 * Call after DOM render (e.g., in useEffect).
 */
export function markCommentedBlocks() {
  const commentSpans = document.querySelectorAll('.conf-inline-comment');
  
  commentSpans.forEach(span => {
    const blockParent = span.closest(
      'p, div, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, pre, section, article, dt, dd, figcaption, figure'
    );
    
    if (blockParent && !blockParent.classList.contains('conf-has-comment')) {
      blockParent.classList.add('conf-has-comment');
    }
  });
}
