import { requestConfluence, view } from "@forge/bridge";

export async function getInlineCommentsForCurrentPage() {
  const context = await view.getContext();
  const pageId = context.extension?.content?.id;

  if (!pageId) {
    throw new Error("No pageId found. Context:", context);
  }

  const response = await requestConfluence(
    `/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current`,
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
