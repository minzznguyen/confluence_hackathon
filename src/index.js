import Resolver from '@forge/resolver';
import { storage } from '@forge/api';

const resolver = new Resolver();

/**
 * Store the current page ID for navigation between modules.
 * Forge storage provides persistent key-value storage (not just a cache).
 * We use this to pass pageId from byline/content action modules to the full page module,
 * since URL parameters can be unreliable across iframe contexts.
 */
resolver.define('setCurrentPageId', async (req) => {
  const { pageId } = req.payload;
  await storage.set('currentPageId', pageId);
  return { success: true, pageId };
});

/**
 * Retrieve the stored page ID for display in the full page module.
 */
resolver.define('getCurrentPageId', async (req) => {
  const pageId = await storage.get('currentPageId');
  return { pageId };
});

export const handler = resolver.getDefinitions();
