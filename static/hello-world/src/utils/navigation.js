import { router } from "@forge/bridge";
import { APP_ID, DEVELOPMENT_ENV } from "../constants";

// Navigates from byline item to full page analytics view
export async function navigateToFullPage(context) {
  if (context.extension?.type !== 'confluence:contentBylineItem') return;

  const pageId = context.extension?.content?.id;
  const currentPath = context.location || window.location.href;
  
  const appIdMatch = currentPath.match(/\/forge-apps\/a\/([^\/]+)/);
  const envIdMatch = currentPath.match(/\/e\/([^\/]+)/);
  
  const appId = appIdMatch?.[1] || APP_ID;
  const envId = envIdMatch?.[1] || DEVELOPMENT_ENV;

  const params = pageId ? `?pageId=${pageId}` : '';
  router.open(`/forge-apps/a/${appId}/e/${envId}/r/hello-world${params}`);
}
