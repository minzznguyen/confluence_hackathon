import { requestConfluence, view } from "@forge/bridge";

export async function getInlineCommentsForCurrentPage() {
  const context = await view.getContext();
  const pageId = context.content?.id;

  if (!pageId) {
    throw new Error("No pageId found. Are you using contentBylineItem?");
  }

  const response = await requestConfluence(
    `/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current&limit=500`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("API Error:", text);
    throw new Error(`Inline comments API failed: ${response.status}`);
  }

  const data = await response.json();

  const filtered = data.results.filter(c => c.pageId === pageId);

  return { pageId, comments: filtered };
}
