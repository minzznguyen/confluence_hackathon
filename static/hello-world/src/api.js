import { requestConfluence, view } from "@forge/bridge";

export async function getInlineCommentsForCurrentPage() {
  // 1. Get the pageId from context
  const context = await view.getContext();
  const pageId = context.extension.page.id;

  // 2. Fetch all inline comments
  const response = await requestConfluence(
    `/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current&limit=500`,
    {
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Inline comments API error:", response.status, text);
    throw new Error(`Failed to fetch inline comments: HTTP ${response.status}`);
  }

  const data = await response.json();

  // 3. Filter for this page only
  return data.results.filter(comment => comment.pageId === pageId);
}
