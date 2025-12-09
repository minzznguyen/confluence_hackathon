import React, { useEffect, useState } from "react";
import { getPageInfo } from "./api";

function convertImagesToDownloadUrls(rawHtml, pageId, baseUrl) {
  if (!rawHtml) return rawHtml;

  return rawHtml.replace(
    /<ac:image[^>]*>[\s\S]*?<ri:attachment[^>]*ri:filename="([^"]+)"[^>]*>[\s\S]*?<\/ac:image>/g,
    (match, filename) => {
      const imgUrl =
        `${baseUrl}/download/attachments/${pageId}/${encodeURIComponent(filename)}`;

      return `
        <div style="text-align:center; margin: 28px 0;">
          <img src="${imgUrl}"
               alt="${filename}"
               style="max-width: 100%; border-radius: 8px;" />
        </div>
      `;
    }
  );
}

export default function App() {
  const [pageInfo, setPageInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { page } = await getPageInfo();
        console.log(11111,page )
        setPageInfo(page);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  if (error) return <p>❌ Error: {error}</p>;
  if (!pageInfo) return <p>Loading page…</p>;

  const html = pageInfo.body.storage.value;
  const baseUrl = pageInfo._links.base; // e.g., https://atlassianhackathon2025.atlassian.net/wiki

  const finalHtml = convertImagesToDownloadUrls(html, pageInfo.id, baseUrl);

  return (
    <div style={{ padding: "32px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "Inter, Arial", marginBottom: 24 }}>
        {pageInfo.title}
      </h1>

      <div
        style={{
          fontFamily: "Inter, Arial",
          color: "#172B4D",
          lineHeight: 1.6,
          fontSize: "16px",
        }}
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />
    </div>
  );
}
