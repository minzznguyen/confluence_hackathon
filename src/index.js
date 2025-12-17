/**
 * Forge Backend Resolver
 * Defines serverless functions invokable from the frontend via @forge/bridge.
 */

import Resolver from '@forge/resolver';

const resolver = new Resolver();

// Add resolver functions here if needed in the future

export const handler = resolver.getDefinitions();

/**
 * Rovo Agent Action: Get Greeting
 * 
 * A simple action that generates a personalized greeting message.
 * This function is invoked by the Rovo Agent when users request a greeting.
 * 
 * @param {Object} payload - The payload containing action inputs and context
 * @param {Object} context - The invocation context containing user accountId and other metadata
 * @returns {string} A greeting message
 */
export function getGreeting(payload, context) {
    console.log(`Action payload: ${JSON.stringify(payload)}`);
    console.log(`Action context: ${JSON.stringify(context)}`);
    
    // Extract the user's name from inputs if provided
    // The Rovo Agent will extract this from the user's conversation
    const userName = payload.userName || 'there';
    
    // Get the accountId from context for personalization
    const accountId = context?.accountId || 'user';
    
    // Generate a friendly greeting message
    const greeting = `Hello ${userName}! Welcome to your Rovo Agent. How can I assist you today?`;
    
    return greeting;
}
