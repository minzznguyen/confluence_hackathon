import { useEffect, useState } from "react";
import { router, view, invoke } from "@forge/bridge";
import { getPageInfo } from "./api";

// Convert <ac:image> + <ri:attachment> → <img>
// baseUrl will be determined from context at runtime
function convertConfluenceImages(html, pageId, baseUrl) {
  if (!html) return html;

  return html
    // Convert <ac:image> blocks into <img> tags
    .replace(/<ac:image[^>]*>([\s\S]*?)<\/ac:image>/g, (match, inner) => {
      const filenameMatch = inner.match(/ri:filename="([^"]+)"/);
      if (!filenameMatch) return "";

      const filename = filenameMatch[1];

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
    // Remove inline comment markers
    .replace(/<ac:inline-comment-marker[^>]*>.*?<\/ac:inline-comment-marker>/g, "");
}

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState(null);
  const [contextInfo, setContextInfo] = useState(null);

  useEffect(() => {
    // Check if this is the byline or content action module and redirect immediately
    view.getContext().then(async (context) => {
      const moduleType = context.extension?.type;
      if (moduleType === 'confluence:contentBylineItem' || moduleType === 'confluence:contentAction') {
        // Get the current page/content info to pass to the analytics page
        const pageId = context.extension?.content?.id;
        const spaceId = context.extension?.space?.id;
        const spaceKey = context.extension?.space?.key;
        
        // Extract app ID and environment ID from the current location
        // Pattern: /forge-apps/a/{app-id}/e/{env-id}/r/{route}
        const currentPath = context.location || window.location.href;
        const appIdMatch = currentPath.match(/\/forge-apps\/a\/([^\/]+)/);
        const envIdMatch = currentPath.match(/\/e\/([^\/]+)/);
        
        const appId = appIdMatch ? appIdMatch[1] : '24e34540-92df-4b82-81a2-46340f7d3440';
        const envId = envIdMatch ? envIdMatch[1] : '839b6a23-c454-41b1-9b1e-9468893d5204';
        
        // Build query parameters with page context
        const params = new URLSearchParams();
        if (pageId) params.append('pageId', pageId);
        if (spaceId) params.append('spaceId', spaceId);
        if (spaceKey) params.append('spaceKey', spaceKey);
        
        // Build full Forge URL with pattern: /forge-apps/a/{app-id}/e/{env-id}/r/{route-prefix}
        const fullUrl = `/forge-apps/a/${appId}/e/${envId}/r/hello-world${params.toString() ? `?${params.toString()}` : ''}`;
        
        // Store pageId in Forge storage before navigating
        if (pageId) {
          await invoke('setCurrentPageId', { pageId });
        }
        
        // Open full page in new tab
        router.open(fullUrl);
      }
    }).catch((err) => {
      console.error('Failed to get context:', err);
    });

    async function load() {
      try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 LOAD: Starting load function');
        console.log('Site:', window.location.hostname);
        console.log('Full URL:', window.location.href);
        
        // Get context from Forge bridge
        const context = await view.getContext();
        
        console.log('Context:', {
          type: context.extension?.type,
          hasContent: !!context.extension?.content,
          contentId: context.extension?.content?.id,
          hasLocation: !!context.location,
          location: context.location
        });
        
        // Try to get pageId from extension context (works for byline/content action)
        let pageIdFromUrl = context.extension?.content?.id;
        let spaceIdFromUrl = context.extension?.space?.id;
        let spaceKeyFromUrl = context.extension?.space?.key;
        
        console.log('Step 1 - From extension context:', {
          pageId: pageIdFromUrl,
          spaceId: spaceIdFromUrl,
          spaceKey: spaceKeyFromUrl
        });
        
        // If not in extension context, parse from context.location (for full page)
        if (!pageIdFromUrl && context.location) {
          console.log('Step 2 - Trying context.location:', context.location);
          const queryStart = context.location.indexOf('?');
          if (queryStart !== -1) {
            const queryString = context.location.substring(queryStart + 1);
            const params = new URLSearchParams(queryString);
            
            pageIdFromUrl = params.get('pageId');
            spaceIdFromUrl = spaceIdFromUrl || params.get('spaceId');
            spaceKeyFromUrl = spaceKeyFromUrl || params.get('spaceKey');
            
            console.log('Extracted from context.location:', {
              pageId: pageIdFromUrl,
              spaceId: spaceIdFromUrl
            });
          }
        }
        
        // Last resort: try Forge storage
        if (!pageIdFromUrl) {
          console.log('Step 3 - Trying Forge storage...');
          try {
            const storageResult = await invoke('getCurrentPageId');
            console.log('Storage result:', storageResult);
            if (storageResult && storageResult.pageId) {
              pageIdFromUrl = storageResult.pageId;
              spaceIdFromUrl = spaceIdFromUrl || storageResult.spaceId;
              spaceKeyFromUrl = spaceKeyFromUrl || storageResult.spaceKey;
              console.log('✅ Retrieved from storage:', pageIdFromUrl);
            }
          } catch (e) {
            console.error('❌ Storage failed:', e);
          }
        }
        
        console.log('Final pageId to fetch:', pageIdFromUrl || 'default (622593)');
        
        // Extract base URL from context or construct from window
        // Try to get from context.location or window.parent
        let baseUrl = 'https://atlassianhackathon2025.atlassian.net'; // fallback
        
        if (context.location) {
          // Parse base URL from context.location
          const urlMatch = context.location.match(/^(https?:\/\/[^\/]+)/);
          if (urlMatch) {
            baseUrl = urlMatch[1];
          }
        }
        
        // Try to extract from parent window as fallback
        try {
          const parentUrl = window.parent.location.origin;
          if (parentUrl && parentUrl !== 'null') {
            baseUrl = parentUrl;
          }
        } catch (e) {
          // Cross-origin blocked, use fallback
        }
        
        console.log('Using base URL:', baseUrl);
        
        // Store context info to display
        if (pageIdFromUrl) {
          setContextInfo({
            pageId: pageIdFromUrl,
            spaceId: spaceIdFromUrl,
            spaceKey: spaceKeyFromUrl
          });
        }

        // Fetch page info using the dynamic page ID from URL
        // If no pageId, don't pass any argument (so default parameter works)
        const p = pageIdFromUrl ? await getPageInfo(pageIdFromUrl) : await getPageInfo();
        const pageId = p.id;

        // Convert Confluence storage-format HTML -> real HTML with dynamic base URL
        const converted = convertConfluenceImages(
          p.body.storage.value,
          pageId,
          baseUrl
        );

        setPage(p);
        setHtml(converted);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    }

    load();
  }, [window.location.href]); // Re-run when URL changes to load new page data

  if (error) return <p className="error-message">Error: {error}</p>;
  if (!page) return <p className="loading-message">Loading page…</p>;

  return (
    <div className="page-container">

      {/* Title */}
      <h1 className="page-title">{page.title}</h1>

      {/* Body Content */}
      <div
        className="confluence-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <style>{`
        .error-message,
        .loading-message {
          padding: 20px;
        }

        .page-container {
          max-width: 820px;
          margin: 0 auto;
          padding: 40px 24px;
          font-family: Inter, Arial, sans-serif;
          line-height: 1.6;
          color: #172B4D;
        }

        .page-title {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .confluence-body {
          font-size: 16px;
        }

        .confluence-body h1 {
          font-size: 26px;
          margin-top: 42px;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .confluence-body p {
          margin-bottom: 16px;
        }

        .confluence-body img {
          border-radius: 8px;
          max-width: 100%;
        }
      `}</style>
    </div>
  );
}
