import { requestConfluence } from "@forge/bridge";

const PAGE_ID = "622593";   // Hardcoded for now

// Get Page Info (storage body)
export async function getPageInfo() {
  const pageId = PAGE_ID;

  const url = `/wiki/api/v2/pages/${pageId}?body-format=storage`;

  const response = await requestConfluence(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Page API failed: HTTP ${response.status}\nURL: ${url}\nResponse:\n${text}`
    );
  }

  const json = await response.json();
  return {
    pageId,
    page: json
  };
}

// Get Inline Comments for the page
export async function getInlineComments() {
  const response = await requestConfluence(
    `/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Inline comments API failed: ${response.status}\n${text}`);
  }

  const data = await response.json();
  // Filter only for this page
  return data.results.filter((c) => c.pageId === PAGE_ID);
}

// Get User Info (given an accountId)
export async function getUserInfo(accountId) {
  if (!accountId) {
    throw new Error("Missing accountId");
  }

  const response = await requestConfluence(
    `/wiki/rest/api/user?accountId=${encodeURIComponent(accountId)}`,
    {
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`User API failed: ${response.status}\n${text}`);
  }

  return response.json();
}
