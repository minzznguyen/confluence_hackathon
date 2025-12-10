/**
 * Forge Backend Resolver
 * Defines serverless functions invokable from the frontend via @forge/bridge.
 */

import Resolver from '@forge/resolver';

const resolver = new Resolver();

// Example resolver - remove if not needed
resolver.define('getText', (req) => {
  console.log('getText called:', req.context);
  return 'Hello, world!';
});

export const handler = resolver.getDefinitions();
