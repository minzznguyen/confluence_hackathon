// Forge App Configuration
export const APP_ID = '24e34540-92df-4b82-81a2-46340f7d3440';
export const DEVELOPMENT_ENV = '839b6a23-c454-41b1-9b1e-9468893d5204';

// Module Types
export const MODULE_TYPES = {
  CONTENT_BYLINE_ITEM: 'confluence:contentBylineItem',
};

// Comment Status Values
export const COMMENT_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  ALL: 'all',
};

// HTTP Headers
export const HTTP_HEADERS = {
  JSON: { Accept: 'application/json' },
};

// Error Messages
export const ERROR_MESSAGES = {
  // API Errors
  MISSING_PAGE_ID: 'Page ID is required',
  MISSING_ACCOUNT_ID: 'Account ID is required',
  MISSING_PAGE_DATA: 'Page data is missing',
  MISSING_PAGE_DATA_FROM_API: 'Page data is missing from API response',
  MISSING_PAGE_ID_FROM_API: 'Page ID is missing from API response',
  INVALID_PAGE_CONTENT: 'Page content is missing or invalid. The page may be empty or corrupted.',
  FAILED_TO_LOAD_PAGE: 'Failed to load page',
  
  // Context Errors
  COULD_NOT_EXTRACT_HOSTNAME: 'Could not extract Confluence hostname from URL.',
  NO_PAGE_ID_IN_URL: 'No pageId found in URL parameters.',
  
  // Generic
  UNEXPECTED_ERROR: 'An unexpected error occurred',
};

// API Endpoints
export const API_ENDPOINTS = {
  PAGE: (pageId) => `/wiki/api/v2/pages/${pageId}?body-format=storage`,
  INLINE_COMMENTS: (pageId) =>
    `/wiki/api/v2/inline-comments?body-format=atlas_doc_format&status=current&limit=250&pageId=${pageId}`,
  USER: (accountId) => `/wiki/rest/api/user?accountId=${encodeURIComponent(accountId)}`,
  ATTACHMENT: (baseUrl, pageId, filename) =>
    `${baseUrl}/wiki/download/attachments/${pageId}/${filename}?api=v2`,
};

