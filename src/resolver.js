// src/resolver.js
import Resolver from "@forge/resolver";
import api, { route } from "@forge/api";

const resolver = new Resolver();

// Get inline comments belonging only to the given page
resolver.define("getInlineCommentsForPage", async ({ payload }) => {
  const { pageId } = payload;

  // 1. Fetch all inline comment
  const res = await api.asApp().requestConfluence(
    // TODO: fetched closed comments?
    route`/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current&resolution-status=open`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("getInlineCommentsForPage error:", res.status, text);
    throw new Error(`getInlineCommentsForPage failed: HTTP ${res.status}`);
  }

  const json = await res.json();

  // 2. Filter comments belonging to this page only
  const filtered = json.results.filter((c) => c.pageId === pageId);

  return filtered;
});

export const run = resolver.getDefinitions();