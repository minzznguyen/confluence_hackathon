/**
 * Forge Backend Resolver
 * Defines serverless functions invokable from the frontend via @forge/bridge.
 */

import Resolver from "@forge/resolver";

const resolver = new Resolver();

export function messageLogger(payload) {
  console.log(`Logging message: ${payload.message}`);
}

export const handler = resolver.getDefinitions();
