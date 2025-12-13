import DOMPurify from 'dompurify';
import { API_ENDPOINTS } from '../constants';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Allows Confluence-specific tags (ac:inline-comment-marker, ac:image, ri:attachment)
 * and attributes needed for comment markers and attachments.
 * 
 * @param {string} html - Raw HTML content
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['ac:inline-comment-marker', 'ac:image', 'ri:attachment'],
    ADD_ATTR: ['ac:ref', 'ri:filename', 'data-marker-ref'],
  });
}

/**
 * Converts Confluence inline comment markers to HTML spans for styling and interaction.
 * Transforms <ac:inline-comment-marker ac:ref="..."> to <span class="conf-inline-comment" data-marker-ref="...">
 * 
 * @param {string} html - HTML string containing Confluence comment markers
 * @returns {string} HTML with comment markers converted to spans
 */
export function wrapInlineCommentMarkers(html) {
  if (!html) return "";

  return html.replace(
    /<ac:inline-comment-marker\b([^>]*)>([\s\S]*?)<\/ac:inline-comment-marker>/g,
    (match, attrs, content) => {
      // Extract ac:ref attribute value to use as data-marker-ref for scroll-to functionality
      const refMatch = attrs.match(/ac:ref="([^"]+)"/);
      const markerRef = refMatch ? refMatch[1] : '';
      return `<span class="conf-inline-comment" data-marker-ref="${markerRef}">${content}</span>`;
    }
  );
}

/**
 * Scrolls to an inline comment element by its marker reference.
 * 
 * @param {string} markerRef - Comment marker reference ID
 */
export function scrollToComment(markerRef) {
  if (!markerRef) return;
  const el = document.querySelector(`[data-marker-ref="${markerRef}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Converts Confluence image macros to standard HTML img tags.
 * Extracts filename from ri:filename attribute and constructs attachment URL.
 * 
 * @param {string} html - HTML string containing <ac:image> macros
 * @param {string} pageId - Confluence page ID for attachment URL
 * @param {string} baseUrl - Confluence instance base URL
 * @returns {string} HTML with image macros converted to img tags
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
 * Main entry point for processing Confluence storage format HTML.
 * Applies sanitization, converts comment markers, and transforms images.
 * 
 * @param {string} rawHtml - Raw HTML from Confluence storage format
 * @param {string} pageId - Confluence page ID for attachment URLs
 * @param {string} baseUrl - Confluence instance base URL
 * @returns {string} Processed HTML ready for rendering
 */
export function processedHTML(rawHtml, pageId, baseUrl) {
  const sanitized = sanitizeHTML(rawHtml);
  const withCommentSpans = wrapInlineCommentMarkers(sanitized);
  const withImages = convertImages(withCommentSpans, pageId, baseUrl);
  return withImages;
}

/**
 * Adds visual indicator class to block elements containing inline comments.
 * Scans DOM for comment spans and marks their parent block elements with 'conf-has-comment' class.
 * Should be called after HTML is rendered to ensure elements exist in DOM.
 */
export function markCommentedBlocks() {
  const commentSpans = document.querySelectorAll('.conf-inline-comment');
  
  commentSpans.forEach(span => {
    // Find the nearest block-level parent element
    const blockParent = span.closest(
      'p, div, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, pre, section, article, dt, dd, figcaption, figure'
    );
    
    if (blockParent && !blockParent.classList.contains('conf-has-comment')) {
      blockParent.classList.add('conf-has-comment');
    }
  });
}
