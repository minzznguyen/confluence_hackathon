import { requestConfluence, view } from "@forge/bridge";

export async function getPageInfo() {
  const context = await view.getContext();
  const pageId = context.extension?.content?.id;

  if (!pageId) {
    throw new Error("No pageId found. Context:", context);
  }

  const response = await requestConfluence(
    `/wiki/api/v2/pages/${pageId}?body-format=storage`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Page API failed: HTTP ${response.status}\nBody:\n${text}`
    );
  }

  const json = await response.json();
  return { pageId, page: json };
}
