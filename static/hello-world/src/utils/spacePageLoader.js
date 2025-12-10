import { invoke } from "@forge/bridge";
import { getPageInfo } from "../api";
import { convertConfluenceImages } from "./imageConverter";

/**
 * Loads page data for the space page module using automatic page tracking.
 * 
 * Strategy:
 * - Uses Forge storage which is automatically updated by the background script
 * - The background script runs on every Confluence page and tracks the current pageId
 * - This ensures the space page always shows analytics for the most recently viewed page
 * 
 * @param {Object} context - The Forge context object
 * @returns {Promise<Object>} Object containing page, html, and baseUrl
 * @throws {Error} If no page has been tracked yet
 */
export async function loadPageForSpacePage(context) {
  // Helper to get current timestamp
  const getTimestamp = () => new Date().toLocaleTimeString();
  
  console.log('');
  console.log('%c ═══════════════════════════════════════════════════════════════ ', 'background: #6554C0; color: white; font-weight: bold;');
  console.log('%c 🔍 SPACE PAGE LOADER - Loading Analytics ', 'background: #6554C0; color: white; font-weight: bold;');
  console.log('%c ═══════════════════════════════════════════════════════════════ ', 'background: #6554C0; color: white; font-weight: bold;');
  console.log(`⏰ Time: ${getTimestamp()}`);
  console.log(`🔗 Current URL: ${window.location.href}`);
  console.log('📋 Context:', context);
  
  let pageId = null;
  let pageInfo = null;
  
  // Retrieve from Forge storage (updated by background script)
  console.log('');
  console.log('%c 📦 RETRIEVING FROM FORGE STORAGE ', 'background: #0052CC; color: white;');
  console.log('   Calling getCurrentPageId resolver...');
  
  try {
    const storageResult = await invoke('getCurrentPageId');
    console.log('   Storage response:', storageResult);
    
    if (storageResult?.pageId) {
      pageId = storageResult.pageId;
      pageInfo = storageResult.pageInfo;
      
      console.log('');
      console.log('%c ✅ FOUND TRACKED PAGE IN STORAGE ', 'background: #00875A; color: white; font-weight: bold;');
      console.log(`   📄 Page ID: ${pageId}`);
      if (pageInfo) {
        console.log(`   📝 Title: ${pageInfo.pageTitle || '(unknown)'}`);
        console.log(`   📁 Space: ${pageInfo.spaceKey || '(unknown)'}`);
        console.log(`   ⏰ Last tracked: ${pageInfo.storedAt || '(unknown)'}`);
      }
      console.log('   ℹ️ This page was tracked by the background script');
    } else {
      console.log('');
      console.log('%c ⚠️ STORAGE IS EMPTY ', 'background: #FFAB00; color: black;');
      console.log('   No page has been tracked yet.');
    }
  } catch (e) {
    console.log('');
    console.error('%c ❌ FAILED TO ACCESS FORGE STORAGE ', 'background: #DE350B; color: white;');
    console.error('   Error:', e.message || e);
    throw new Error(
      'Failed to access Forge storage. ' +
      'Please make sure the app has storage:app permission.'
    );
  }
  
  // If no pageId, show clear error message
  if (!pageId) {
    console.log('');
    console.error('%c ❌ NO PAGE ID FOUND ', 'background: #DE350B; color: white; font-weight: bold;');
    console.log('');
    console.log('%c 💡 HOW TO FIX: ', 'background: #FFAB00; color: black; font-weight: bold;');
    console.log('   1. Navigate to any Confluence page');
    console.log('   2. Wait 1-2 seconds (background script tracks automatically)');
    console.log('   3. Then click the Space Page link again');
    console.log('');
    throw new Error(
      'No page has been tracked yet. ' +
      'Please view a Confluence page first, then try again.'
    );
  }
  
  console.log('');
  console.log('%c 📌 LOADING PAGE DATA ', 'background: #0052CC; color: white; font-weight: bold;');
  console.log(`   Page ID: ${pageId}`);
  
  // Extract base URL from context
  let baseUrl = 'https://atlassianhackathon2025.atlassian.net'; // fallback
  
  if (context.location) {
    const urlMatch = context.location.match(/^(https?:\/\/[^\/]+)/);
    if (urlMatch) {
      baseUrl = urlMatch[1];
    }
  }
  
  // Try parent window as additional fallback
  try {
    const parentUrl = window.parent.location.origin;
    if (parentUrl && parentUrl !== 'null') {
      baseUrl = parentUrl;
    }
  } catch (e) {
    // Cross-origin blocked, use context-based fallback
  }
  
  console.log(`   Base URL: ${baseUrl}`);
  console.log('   Fetching page data from Confluence API...');
  
  // Fetch page data
  const page = await getPageInfo(pageId);
  
  // Convert Confluence HTML
  const html = convertConfluenceImages(
    page.body.storage.value,
    page.id,
    baseUrl
  );
  
  console.log('');
  console.log('%c ✅ PAGE LOADED SUCCESSFULLY ', 'background: #00875A; color: white; font-weight: bold; font-size: 14px;');
  console.log(`   📄 Title: ${page.title}`);
  console.log(`   🆔 ID: ${page.id}`);
  console.log(`   ⏰ Loaded at: ${new Date().toLocaleTimeString()}`);
  console.log('');
  console.log('%c ═══════════════════════════════════════════════════════════════ ', 'background: #6554C0; color: white;');
  console.log('');
  
  return {
    page,
    html,
    baseUrl
  };
}

