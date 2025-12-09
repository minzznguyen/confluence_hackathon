import { useEffect, useState } from "react";
import { router, view, invoke } from "@forge/bridge";
import { getPageInfo } from "./api";

const baseUrl = "https://atlassianhackathon2025.atlassian.net";

// Convert <ac:image> + <ri:attachment> → <img>
function convertConfluenceImages(html, pageId) {
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
        
        // Navigate to full page
        router.navigate(fullUrl);
      }
    }).catch((err) => {
      console.error('Failed to get context:', err);
    });

    async function load() {
      try {
        // Get context from Forge bridge
        const context = await view.getContext();
        
        // Try to get pageId from extension context (works for byline/content action)
        let pageIdFromUrl = context.extension?.content?.id;
        let spaceIdFromUrl = context.extension?.space?.id;
        let spaceKeyFromUrl = context.extension?.space?.key;
        
        // If not in extension context, parse from context.location (for full page)
        if (!pageIdFromUrl && context.location) {
          const queryStart = context.location.indexOf('?');
          if (queryStart !== -1) {
            const queryString = context.location.substring(queryStart + 1);
            const params = new URLSearchParams(queryString);
            
            pageIdFromUrl = params.get('pageId');
            spaceIdFromUrl = spaceIdFromUrl || params.get('spaceId');
            spaceKeyFromUrl = spaceKeyFromUrl || params.get('spaceKey');
          }
        }
        
        // Last resort: try Forge storage
        if (!pageIdFromUrl) {
          try {
            const storageResult = await invoke('getCurrentPageId');
            if (storageResult && storageResult.pageId) {
              pageIdFromUrl = storageResult.pageId;
              spaceIdFromUrl = spaceIdFromUrl || storageResult.spaceId;
              spaceKeyFromUrl = spaceKeyFromUrl || storageResult.spaceKey;
            }
          } catch (e) {
            // Silently fall back to default
          }
        }
        
        // Store context info to display
        if (pageIdFromUrl) {
          setContextInfo({
            pageId: pageIdFromUrl,
            spaceId: spaceIdFromUrl,
            spaceKey: spaceKeyFromUrl
          });
        }

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

        // Convert Confluence storage-format HTML -> real HTML
        const converted = convertConfluenceImages(
          p.body.storage.value,
          pageId,
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

  if (error) return <p style={{ padding: 20 }}>Error: {error}</p>;
  if (!page) return <p style={{ padding: 20 }}>Loading page…</p>;

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "Inter, Arial, sans-serif",
        lineHeight: "1.6",
        color: "#172B4D",
      }}
    >

      {/* Title */}
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>{page.title}</h1>

      {/* Body Content */}
      <div
        className="confluence-body"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          fontSize: 16,
        }}
      />

      <style>{`
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
