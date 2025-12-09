import { requestConfluence } from "@forge/bridge";

// Get Page Info (storage body)
// Pass in pageId to fetch specific page, or returns a placeholder if none provided
export async function getPageInfo(pageId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 API: getPageInfo() called');
  console.log('Input:', {
    receivedPageId: pageId,
    type: typeof pageId,
    isUndefined: pageId === undefined,
    isNull: pageId === null,
    isEmpty: pageId === '',
    currentSite: window.location.hostname
  });
  
  // Handle undefined/null/empty - return a helpful placeholder page
  if (!pageId || pageId === 'undefined' || pageId === 'null') {
    console.warn('⚠️ No pageId provided - returning placeholder');
    return {
      id: null,
      title: 'Welcome to Heatmap Analytics',
      body: {
        storage: {
          value: `
            <h2>No Page Selected</h2>
            <p>To view analytics for a specific page:</p>
            <ul>
              <li>Go to any Confluence page</li>
              <li>Click <strong>"Heatmap Analytics"</strong> in the content byline (under the page title)</li>
              <li>Or click <strong>"View Heatmap Analytics"</strong> in the ••• menu</li>
            </ul>
            <p>The analytics dashboard will show data specific to that page.</p>
          `
        }
      }
    };
  }
  
  const url = `/wiki/api/v2/pages/${pageId}?body-format=storage`;
  console.log('🔍 API Request:', {
    url,
    pageId,
    fullURL: `${window.location.origin}${url}`
  });

  const response = await requestConfluence(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('❌ API Request Failed!', {
      status: response.status,
      url,
      pageId,
      site: window.location.hostname,
      response: text
    });
    throw new Error(
      `Page API failed: HTTP ${response.status}\nURL: ${url}\nResponse:\n${text}`
    );
  }

  const json = await response.json();
  console.log('✅ API Success!', {
    requestedId: pageId,
    returnedId: json.id,
    title: json.title,
    match: pageId === String(json.id)
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return json
}

// Get Inline Comments for the page
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
  // Filter only for this page
  return data.results.filter((c) => c.pageId === pageId);
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
