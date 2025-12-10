/**
 * Background Script - Page Tracker
 * 
 * This script runs automatically on EVERY Confluence page view.
 * Its sole purpose is to track which page the user is currently viewing
 * and store that information in Forge storage.
 * 
 * The space page module will then read this storage to determine
 * which page's analytics to display.
 * 
 * Note: This uses React as a minimal entry point required by react-scripts,
 * but the actual tracking logic runs immediately when the script loads.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { view, invoke } from '@forge/bridge';

/**
 * Minimal React component for the background script.
 * Background scripts don't need visible UI - this just satisfies
 * react-scripts requirements and shows tracking is active.
 */
function PageTracker() {
  return null; // No visible UI needed for background script
}

// Render the minimal component (required for react-scripts build)
ReactDOM.render(<PageTracker />, document.getElementById('root'));

// ============================================
// PAGE TRACKING LOGIC
// Runs immediately when the script loads
// ============================================

// Helper to get current timestamp for logging
const getTimestamp = () => new Date().toLocaleTimeString();

console.log('');
console.log('%c ═══════════════════════════════════════════════════════════════ ', 'background: #0052CC; color: white; font-weight: bold;');
console.log('%c 📍 PAGE TRACKER - Background Script Initialized ', 'background: #0052CC; color: white; font-weight: bold;');
console.log('%c ═══════════════════════════════════════════════════════════════ ', 'background: #0052CC; color: white; font-weight: bold;');
console.log(`⏰ Time: ${getTimestamp()}`);
console.log(`🔗 Current URL: ${window.location.href}`);

// Get the current page context and store the page ID
view.getContext().then(async (context) => {
  console.log('');
  console.log('%c 📋 CONTEXT RECEIVED ', 'background: #6554C0; color: white;');
  console.log('   Extension type:', context.extension?.type);
  console.log('   Module key:', context.extension?.moduleKey);
  
  // Extract page ID from the current page context
  const pageId = context.extension?.content?.id;
  const pageTitle = context.extension?.content?.title;
  const spaceId = context.extension?.space?.id;
  const spaceKey = context.extension?.space?.key;
  const spaceName = context.extension?.space?.name;
  
  // Log full content details for debugging
  console.log('   Content details:', {
    id: pageId,
    title: pageTitle,
    type: context.extension?.content?.type
  });
  console.log('   Space details:', {
    id: spaceId,
    key: spaceKey,
    name: spaceName
  });
  
  if (pageId) {
    console.log('');
    console.log('%c 🎯 PAGE DETECTED - STORING TO HISTORY ', 'background: #36B37E; color: white; font-weight: bold;');
    console.log(`   📄 Page ID: ${pageId}`);
    console.log(`   📝 Title: ${pageTitle || '(unknown)'}`);
    console.log(`   📁 Space: ${spaceName || spaceKey || '(unknown)'}`);
    console.log(`   ⏰ Time: ${getTimestamp()}`);
    
    try {
      // Store the current page ID in Forge storage
      const result = await invoke('setCurrentPageId', { 
        pageId, 
        spaceId, 
        spaceKey,
        pageTitle,
        timestamp: new Date().toISOString()
      });
      
      console.log('');
      console.log('%c ✅ SUCCESS - PAGE ID STORED IN FORGE STORAGE ', 'background: #00875A; color: white; font-weight: bold; font-size: 14px;');
      console.log(`   📄 Stored pageId: ${pageId}`);
      console.log(`   📝 Page title: ${pageTitle || '(unknown)'}`);
      console.log(`   ⏰ Stored at: ${getTimestamp()}`);
      console.log('   📦 Storage response:', result);
      console.log('');
      console.log('%c 💡 TIP: Click on Space Page to see analytics for this page ', 'background: #FFAB00; color: black;');
      
    } catch (error) {
      console.log('');
      console.error('%c ❌ ERROR - FAILED TO STORE PAGE ID ', 'background: #DE350B; color: white; font-weight: bold;');
      console.error('   Error:', error.message || error);
      console.error('   Full error:', error);
    }
  } else {
    console.log('');
    console.log('%c ⚠️ NO PAGE ID IN CONTEXT ', 'background: #FFAB00; color: black;');
    console.log('   This is normal for space pages, global pages, or non-content views.');
    console.log('   Page tracking only works on actual Confluence content pages.');
  }
  
  console.log('');
  console.log('%c ═══════════════════════════════════════════════════════════════ ', 'background: #0052CC; color: white;');
  console.log('');
  
}).catch((error) => {
  console.log('');
  console.error('%c ❌ FATAL ERROR - FAILED TO GET CONTEXT ', 'background: #DE350B; color: white; font-weight: bold;');
  console.error('   Error:', error.message || error);
  console.error('   Full error:', error);
});

