/**
 * Converts Confluence storage format HTML to standard HTML.
 * 
 * Specifically handles:
 * - <ac:image> + <ri:attachment> tags → standard <img> tags
 * - <ac:inline-comment-marker> removal
 * 
 * @param {string} html - Raw Confluence storage format HTML
 * @param {string} pageId - The Confluence page ID (for constructing attachment URLs)
 * @param {string} baseUrl - The base URL of the Confluence site (e.g., https://yoursite.atlassian.net)
 * @returns {string} Converted HTML with standard img tags
 */
export function convertConfluenceImages(html, pageId, baseUrl) {
  if (!html) return html;

  return html
    // Convert <ac:image> blocks into <img> tags
    .replace(/<ac:image[^>]*>([\s\S]*?)<\/ac:image>/g, (match, inner) => {
      const filenameMatch = inner.match(/ri:filename="([^"]+)"/);
      if (!filenameMatch) return "";

      const filename = filenameMatch[1];

      // Construct the attachment download URL
      const imgUrl = `${baseUrl}/wiki/download/attachments/${pageId}/${filename}?api=v2`;

      return `
        <img 
          src="${imgUrl}" 
          style="max-width: 100%; 
                 border-radius: 8px; 
                 margin: 24px 0;
                 display: block;"
        />
      `;
    })
    // Remove inline comment markers (they're not visible in rendered view)
    .replace(/<ac:inline-comment-marker[^>]*>.*?<\/ac:inline-comment-marker>/g, "");
}

