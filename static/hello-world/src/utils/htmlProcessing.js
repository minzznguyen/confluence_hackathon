import { API_ENDPOINTS } from '../constants';

// Converts <ac:inline-comment-marker> to <span> with data-marker-ref attribute
export function wrapInlineCommentMarkers(html) {
  if (!html) return "";

  return html.replace(
    /<ac:inline-comment-marker\b([^>]*)>([\s\S]*?)<\/ac:inline-comment-marker>/g,
    (match, attrs, content) => {
      // Extract ac:ref attribute value
      const refMatch = attrs.match(/ac:ref="([^"]+)"/);
      const markerRef = refMatch ? refMatch[1] : '';
      return `<span class="conf-inline-comment" data-marker-ref="${markerRef}">${content}</span>`;
    }
  );
}

// Scrolls to the inline comment by marker ref
export function scrollToComment(markerRef) {
  if (!markerRef) return;
  const el = document.querySelector(`[data-marker-ref="${markerRef}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Converts <ac:image> macros to <img> tags
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

// Main entry point: processes Confluence HTML for rendering
export function processedHTML(rawHtml, pageId, baseUrl) {
  const withCommentSpans = wrapInlineCommentMarkers(rawHtml);
  const withImages = convertImages(withCommentSpans, pageId, baseUrl);
  return withImages;
}

// Adds visual indicator to block elements containing inline comments
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
