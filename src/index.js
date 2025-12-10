import Resolver from '@forge/resolver';
import { storage } from '@forge/api';

const resolver = new Resolver();

/**
 * Store the current page ID for navigation between modules.
 * 
 * This is called by the background script (page-tracker) every time the user
 * navigates to a Confluence page. The pageId is stored in Forge app storage
 * so the space page module can retrieve it to show analytics.
 * 
 * Forge storage provides persistent key-value storage (not just a cache).
 */
resolver.define('setCurrentPageId', async (req) => {
  const { pageId, spaceId, spaceKey, pageTitle, timestamp } = req.payload;
  
  // Log the storage operation for debugging
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 RESOLVER: setCurrentPageId called');
  console.log(`   Page ID: ${pageId}`);
  console.log(`   Page Title: ${pageTitle || '(not provided)'}`);
  console.log(`   Space Key: ${spaceKey || '(not provided)'}`);
  console.log(`   Timestamp: ${timestamp || new Date().toISOString()}`);
  
  // Store the complete page info for better tracking
  const pageInfo = {
    pageId,
    spaceId,
    spaceKey,
    pageTitle,
    storedAt: timestamp || new Date().toISOString()
  };
  
  await storage.set('currentPageId', pageId);
  await storage.set('currentPageInfo', pageInfo);
  
  console.log('✅ RESOLVER: Successfully stored in Forge storage');
  console.log('   Stored pageId:', pageId);
  console.log('   Full page info:', JSON.stringify(pageInfo));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return { success: true, pageId, pageInfo };
});

/**
 * Retrieve the stored page ID for display in the space page module.
 * 
 * The space page module calls this to get the last tracked page ID
 * so it can display analytics for that page.
 * 
 * Also returns the site URL from the backend context context as a reliable source of truth.
 */
resolver.define('getCurrentPageId', async (req) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 RESOLVER: getCurrentPageId called');
  
  const pageId = await storage.get('currentPageId');
  const pageInfo = await storage.get('currentPageInfo');
  
  // Get site URL from backend context (Reliable Source of Truth)
  const siteUrl = req.context?.siteUrl || '';

  console.log(`   Retrieved pageId: ${pageId || '(none stored)'}`);
  console.log(`   Page info:`, pageInfo ? JSON.stringify(pageInfo) : '(none stored)');
  console.log(`   Site URL: ${siteUrl}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return { pageId, pageInfo, siteUrl };
});

export const handler = resolver.getDefinitions();
