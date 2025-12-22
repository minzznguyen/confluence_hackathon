/**
 * Forge Backend Resolver
 * Defines serverless functions invokable from the frontend via @forge/bridge.
 */

import Resolver from '@forge/resolver';

const resolver = new Resolver();

// Add resolver functions here if needed in the future

export const handler = resolver.getDefinitions();
