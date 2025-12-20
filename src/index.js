import Resolver from "@forge/resolver";

const resolver = new Resolver();

export const handler = resolver.getDefinitions();

export function messageTestLogger(payload) {
  console.log(`Testing message: ${payload.message}`);
}
