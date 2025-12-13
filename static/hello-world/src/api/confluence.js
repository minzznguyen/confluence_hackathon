import { API_ENDPOINTS, ERROR_MESSAGES } from "../constants";
import { apiRequest } from "./apiClient";

export async function getPageInfo(pageId) {
  if (!pageId) {
    throw new Error(ERROR_MESSAGES.MISSING_PAGE_ID);
  }
  return apiRequest(API_ENDPOINTS.PAGE(pageId), 'Page API');
}

export async function getInlineComments(pageId) {
  if (!pageId) {
    throw new Error(ERROR_MESSAGES.MISSING_PAGE_ID);
  }

  const data = await apiRequest(API_ENDPOINTS.INLINE_COMMENTS(pageId), 'Inline comments API');
  
  if (!data || !Array.isArray(data.results)) {
    return [];
  }
  return data.results.filter((comment) => comment?.pageId === pageId);
}

export async function getUserInfo(accountId) {
  if (!accountId) {
    throw new Error(ERROR_MESSAGES.MISSING_ACCOUNT_ID);
  }
  return apiRequest(API_ENDPOINTS.USER(accountId), 'User API');
}
