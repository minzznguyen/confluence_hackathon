export const API_ENDPOINTS = {
  PAGE: (pageId) => `/wiki/api/v2/pages/${pageId}?body-format=storage`,
  INLINE_COMMENTS: (pageId) =>
    `/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current&limit=250&pageId=${pageId}`,
  USER: (accountId) => `/wiki/rest/api/user?accountId=${encodeURIComponent(accountId)}`,
  ATTACHMENT: (baseUrl, pageId, filename) =>
    `${baseUrl}/wiki/download/attachments/${pageId}/${filename}?api=v2`,
};

