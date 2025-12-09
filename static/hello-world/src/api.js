import { requestConfluence } from "@forge/bridge";

/**
 * Fetches page information including title and body content.
 * @param {string} pageId - The Confluence page ID
 * @returns {Promise<Object>} Page data with id, title, and body.storage.value
 */
export async function getPageInfo(pageId) {
  if (!pageId) {
    throw new Error('pageId is required');
  }

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

  return response.json();
}

/**
 * Fetches inline comments for a specific page.
 * @param {string} pageId - The Confluence page ID (optional, fetches all if not provided)
 * @returns {Promise<Array>} Array of inline comments
 */
export async function getInlineComments(pageId) {
  const response = await requestConfluence(
    `/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Inline comments API failed: ${response.status}\n${text}`);
  }

  const data = await response.json();
  
  // Filter by pageId if provided
  if (pageId) {
    return data.results.filter((c) => c.pageId === pageId);
  }
  
  return data.results;
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
