import { invoke } from "@forge/bridge";

// Get inline comments for one page only
export async function getInlineCommentsForPage(pageId) {
  return await invoke("getInlineCommentsForPage", { pageId });
}
