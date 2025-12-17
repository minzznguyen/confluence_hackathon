import React from 'react';
import ReactDOM from 'react-dom';
import { useEffect } from 'react';
import { rovo, view } from "@forge/bridge";

/**
 * Simple component that opens the Rovo agent when mounted.
 * This is used by the content action to open the Rovo chat sidebar.
 */
function RovoAgentOpener() {
  useEffect(() => {
    const openAgent = async () => {
      try {
        await rovo.open({
          type: "forge",
          agentName: "Simple Assistant",
          agentKey: "simple-assistant",
        });
        // Close any modal/viewport if needed
        view.close();
      } catch (error) {
        console.error("Failed to open Rovo agent:", error);
      }
    };

    openAgent();
  }, []);

  return null; // Don't render anything, just open Rovo
}

ReactDOM.render(
  <React.StrictMode>
    <RovoAgentOpener />
  </React.StrictMode>,
  document.getElementById('root')
);
