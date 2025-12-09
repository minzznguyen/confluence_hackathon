import { requestConfluence } from "@forge/bridge";

export async function getUserInfo(accountId) {
  if (!accountId) {
    throw new Error("Missing accountId");
  }

  // Encode the accountId for REST API
  const encodedId = encodeURIComponent(accountId);

  const response = await requestConfluence(
    `/wiki/rest/api/user?accountId=${encodedId}`,
    {
      headers: {
        "Accept": "application/json"
      }
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("User info API error:", response.status, text);
    throw new Error(`Failed to fetch user info. Status: ${response.status}`);
  }

  return response.json();
}
