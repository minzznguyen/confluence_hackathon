import { router } from "@forge/bridge";

// Navigates from byline item to full page analytics view
export async function navigateToFullPage(context) {
  if (context.extension?.type !== 'confluence:contentBylineItem') return;

  const pageId = context.extension?.content?.id;
  const currentPath = context.location || window.location.href;
  
  const appIdMatch = currentPath.match(/\/forge-apps\/a\/([^\/]+)/);
  const envIdMatch = currentPath.match(/\/e\/([^\/]+)/);
  
  const appId = appIdMatch?.[1] || '24e34540-92df-4b82-81a2-46340f7d3440';
  const envId = envIdMatch?.[1] || '839b6a23-c454-41b1-9b1e-9468893d5204';

  const params = pageId ? `?pageId=${pageId}` : '';
  router.open(`/forge-apps/a/${appId}/e/${envId}/r/hello-world${params}`);
}
