import Resolver from '@forge/resolver';
import { storage } from '@forge/api';

const resolver = new Resolver();

resolver.define('getText', (req) => {
  console.log(req);
  return 'Hello, world!';
});

// Store the current page ID for navigation
resolver.define('setCurrentPageId', async (req) => {
  const { pageId } = req.payload;
  await storage.set('currentPageId', pageId);
  return { success: true, pageId };
});

// Get the stored page ID
resolver.define('getCurrentPageId', async (req) => {
  const pageId = await storage.get('currentPageId');
  return { pageId };
});

export const handler = resolver.getDefinitions();
