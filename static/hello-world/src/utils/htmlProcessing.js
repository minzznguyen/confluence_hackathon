import DOMPurify from "dompurify";
import { API_ENDPOINTS } from "../constants";
import { getInlineMarkerRefToColor } from "./colorStrip";

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
    ADD_TAGS: ["ac:inline-comment-marker", "ac:image", "ri:attachment"],
    ADD_ATTR: ["ac:ref", "ri:filename", "data-marker-ref"],
  });
}

/**
 * Converts Confluence inline comment markers to HTML spans for styling and interaction.
 * Transforms <ac:inline-comment-marker ac:ref="..."> to <span class="conf-inline-comment" data-marker-ref="...">
 *
 * @param {string} html - HTML string containing Confluence comment markers
 * @returns {string} HTML with comment markers converted to spans
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
      const colorClass =
        inlineMarkerRef && colorMap.has(inlineMarkerRef)
          ? colorMap.get(inlineMarkerRef)
          : "comment-rank-0";

      return `<span class="conf-inline-comment ${colorClass}" data-marker-ref="${inlineMarkerRef || ""}">${content}</span>`;
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
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
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

  return html.replace(
    /<ac:image[^>]*>([\s\S]*?)<\/ac:image>/g,
    (fullMatch, innerContent) => {
      const filenameMatch = innerContent.match(/ri:filename="([^"]+)"/);
      if (!filenameMatch) return "";

      const filename = filenameMatch[1];
      const imageUrl = API_ENDPOINTS.ATTACHMENT(baseUrl, pageId, filename);

      return `<img src="${imageUrl}" class="conf-img" alt="${filename}" />`;
    }
  );
}

/**
 * Main entry point for processing Confluence storage format HTML.
 * Applies sanitization, converts comment markers, and transforms images.
 * Order matters: comments first, then images.
 * @param {string} rawHtml - Raw Confluence storage format HTML
 * @param {string} pageId - Page ID for attachment URLs
 * @param {string} baseUrl - Base URL of Confluence instance
 * @param {Array} comments - Array of inline comments for color ranking (optional)
 * @returns {string} Processed HTML ready for rendering
 */
export function processedHTML(rawHtml, pageId, baseUrl, comments = []) {
  const sanitized = sanitizeHTML(rawHtml);
  // Generate color map from comments if provided
  const colorMap =
    comments.length > 0 ? getInlineMarkerRefToColor(comments) : new Map();
  const withCommentSpans = wrapInlineCommentMarkers(sanitized, colorMap);
  const withImages = convertImages(withCommentSpans, pageId, baseUrl);
  return withImages;
}

/**
 * Adds visual indicator class to block elements containing inline comments.
 * Applies matching color rank class for border styling.
 * Call after DOM render (e.g., in useEffect).
 * Scans DOM for comment spans and marks their parent block elements with 'conf-has-comment' class.
 * Should be called after HTML is rendered to ensure elements exist in DOM.
 */
export function markCommentedBlocks() {
  const commentSpans = document.querySelectorAll(".conf-inline-comment");

  commentSpans.forEach((span) => {
    // Find the nearest block-level parent element
    const blockParent = span.closest(
      "p, div, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, pre, section, article, dt, dd, figcaption, figure"
    );

    if (blockParent && !blockParent.classList.contains("conf-has-comment")) {
      blockParent.classList.add("conf-has-comment");

      // Extract color rank from span's classes
      const classes = span.classList;
      for (let i = 0; i < classes.length; i++) {
        if (classes[i].startsWith("comment-rank-")) {
          blockParent.classList.add(`conf-has-${classes[i]}`);
          break;
        }
      }
    }
  });
}
