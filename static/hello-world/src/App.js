import { useEffect, useState } from "react";
import { getPageInfo } from "./api";
import "./index.css";

const BASE_URL = "https://atlassianhackathon2025.atlassian.net";

// Convert only images; DO NOT touch inline styling
function convertImages(html, pageId) {
  if (!html) return "";

  return html.replace(/<ac:image[^>]*>([\s\S]*?)<\/ac:image>/g, (_, inner) => {
    const match = inner.match(/ri:filename="([^"]+)"/);
    if (!match) return "";

    const filename = match[1];
    const url = `${BASE_URL}/wiki/download/attachments/${pageId}/${filename}?api=v2`;

    return `<img src="${url}" class="conf-img" />`;
  });
}

export default function App() {
  const [page, setPage] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const page = await getPageInfo();
        const raw = page.body.storage.value;

        const cleaned = convertImages(raw, page.id);

        setPage(page);
        setHtml(cleaned);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  if (error) return <div className="conf-error">❌ {error}</div>;
  if (!page) return <div className="conf-loading">Loading…</div>;

  return (
    <div className="conf-container">
      <h1 className="conf-title">{page.title}</h1>
      <div
        className="conf-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
