/**
 * HTML Processing Utilities
 * Transforms Confluence storage format into renderable HTML.
 */

import { API_ENDPOINTS } from '../constants';
import { getInlineMarkerRefToColor } from './colorStrip';

/**
 * Converts <ac:inline-comment-marker> tags to styled <span> elements.
 * @param {string} html - HTML content with ac:inline-comment-marker tags
 * @param {Map} colorMap - Map of inlineMarkerRef to CSS class names
 */
export function wrapInlineCommentMarkers(html, colorMap = new Map()) {
  if (!html) return "";

  return html.replace(
    /<ac:inline-comment-marker\b([^>]*)>([\s\S]*?)<\/ac:inline-comment-marker>/g,
    (match, attributes, content) => {
      // Extract ac:ref attribute value
      const refMatch = attributes.match(/ac:ref="([^"]+)"/);
      const inlineMarkerRef = refMatch ? refMatch[1] : null;
      
      // Get color class from map, default to lightest if not found
      const colorClass = inlineMarkerRef && colorMap.has(inlineMarkerRef) 
        ? colorMap.get(inlineMarkerRef) 
        : 'comment-rank-0';
      
      return `<span class="conf-inline-comment ${colorClass}" data-ref="${inlineMarkerRef || ''}">${content}</span>`;
    }
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
 * @param {string} rawHtml - Raw Confluence storage format HTML
 * @param {string} pageId - Page ID for attachment URLs
 * @param {string} baseUrl - Base URL of Confluence instance
 * @param {Array} comments - Array of inline comments for color ranking (optional)
 */
export function processedHTML(rawHtml, pageId, baseUrl, comments = []) {
  // Generate color map from comments if provided
  const colorMap = comments.length > 0 ? getInlineMarkerRefToColor(comments) : new Map();
  
  const withCommentSpans = wrapInlineCommentMarkers(rawHtml, colorMap);
  const withImages = convertImages(withCommentSpans, pageId, baseUrl);
  return withImages;
}

/**
 * Adds visual indicator class to block elements containing inline comments.
 * Applies matching color rank class for border styling.
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
      
      // Extract color rank from span's classes
      const classes = span.classList;
      for (let i = 0; i < classes.length; i++) {
        if (classes[i].startsWith('comment-rank-')) {
          blockParent.classList.add(`conf-has-${classes[i]}`);
          break;
        }
      }
    }
  });
}
