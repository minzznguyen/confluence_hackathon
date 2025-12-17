import { rovo } from "@forge/bridge";

/**
 * Opens the Rovo chat sidebar with the Simple Assistant agent.
 * This function is called when the Rovo agent byline item is clicked.
 * 
 * @param {string} [prompt] - Optional prompt to send to the agent when opening
 */
export async function openRovoAgent(prompt) {
  try {
    await rovo.open({
      type: "forge",
      agentName: "Simple Assistant",
      agentKey: "simple-assistant",
      prompt: prompt,
    });
  } catch (error) {
    console.error("Failed to open Rovo agent:", error);
    throw new Error(`Failed to open Rovo agent: ${error.message || error}`);
  }
}
