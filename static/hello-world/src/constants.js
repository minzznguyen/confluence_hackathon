// Forge App Configuration
export const APP_ID = '24e34540-92df-4b82-81a2-46340f7d3440';
export const DEVELOPMENT_ENV = '839b6a23-c454-41b1-9b1e-9468893d5204';

export const API_ENDPOINTS = {
  PAGE: (pageId) => `/wiki/api/v2/pages/${pageId}?body-format=storage`,
  INLINE_COMMENTS: (pageId) =>
    `/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current&limit=250&pageId=${pageId}`,
  USER: (accountId) => `/wiki/rest/api/user?accountId=${encodeURIComponent(accountId)}`,
  ATTACHMENT: (baseUrl, pageId, filename) =>
    `${baseUrl}/wiki/download/attachments/${pageId}/${filename}?api=v2`,
};

