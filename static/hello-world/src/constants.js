/**
 * Application Constants
 * Centralizes constants to avoid magic strings scattered across files.
 */

// Base URL for the Confluence instance (used for attachment URLs)
export const BASE_URL = "https://atlassianhackathon2025.atlassian.net";

// Demo page ID - hardcoded for demo, should be dynamic in production
export const DEMO_PAGE_ID = "622593";

// API endpoint builders
export const API_ENDPOINTS = {
  PAGE: (pageId) => `/wiki/api/v2/pages/${pageId}?body-format=storage`,
  INLINE_COMMENTS: `/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current`,
  USER: (accountId) => `/wiki/rest/api/user?accountId=${encodeURIComponent(accountId)}`,
  ATTACHMENT: (pageId, filename) => `${BASE_URL}/wiki/download/attachments/${pageId}/${filename}?api=v2`,
};

