import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function load() {
      try {
        const p = await getPageInfo();
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
  }, []);

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
