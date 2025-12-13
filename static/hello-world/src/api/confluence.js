import { requestConfluence } from "@forge/bridge";
import { API_ENDPOINTS } from "../constants";

// Fetches page data including content in storage format
export async function getPageInfo(pageId) {
  if (!pageId) {
    throw new Error("Page ID is required to fetch page info");
  }
  const url = API_ENDPOINTS.PAGE(pageId);

  const response = await requestConfluence(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Page API failed: HTTP ${response.status}\nURL: ${url}\nResponse:\n${errorText}`);
  }

  return response.json();
}

// Fetches inline comments for a page
export async function getInlineComments(pageId) {
  if (!pageId) {
    throw new Error("Page ID is required to fetch inline comments");
  }

  const response = await requestConfluence(API_ENDPOINTS.INLINE_COMMENTS(pageId), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Inline comments API failed: HTTP ${response.status}\n${errorText}`);
  }

  const data = await response.json();
  // Null check: ensure data.results exists and is an array
  if (!data || !Array.isArray(data.results)) {
    return [];
  }
  return data.results.filter((comment) => comment?.pageId === pageId);
}

// Fetches user profile by Atlassian account ID
export async function getUserInfo(accountId) {
  if (!accountId) {
    throw new Error("Missing accountId");
  }

  const response = await requestConfluence(API_ENDPOINTS.USER(accountId), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`User API failed: HTTP ${response.status}\n${errorText}`);
  }

  return response.json();
}
