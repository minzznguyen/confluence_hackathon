import { useEffect, useState, useRef } from "react";
import { markCommentedBlocks } from "../utils/htmlProcessing";
import { bindInlineCommentPopup, getEnrichedCommentsForMarker } from "../utils/commentPopup";

/**
 * Hook for managing inline comment popup state and event listeners.
 * Handles popup visibility, position, and binding click listeners to comment markers.
 * 
 * @param {string} html - HTML content to bind listeners to
 * @param {boolean} isLoading - Whether page data is still loading
 * @param {Array<Object>} comments - Array of comment objects
 * @returns {Object} Object containing popup state and close handler
 */
export function useCommentPopup(html, isLoading, comments) {
  const [popup, setPopup] = useState({
    visible: false,
    y: 0,
    comments: [],
    markerRef: null, // Track which marker is currently open
    target: null,
  });

  // Use ref to track current popup state for synchronous access
  const popupRef = useRef(popup);
  popupRef.current = popup;

  // Mark block elements containing inline comments after HTML renders
  // Uses requestAnimationFrame to ensure DOM is ready before querying elements
  useEffect(() => {
    if (!html || isLoading) return;
    const rafId = requestAnimationFrame(() => {
      markCommentedBlocks();
    });
    return () => cancelAnimationFrame(rafId);
  }, [html, isLoading]);

  // Bind click listeners to inline comment markers to open popup
  useEffect(() => {
    if (!html || isLoading || comments.length === 0) return;

    let cleanup = null;
    let isMounted = true;
    
    // Function to get current popup state from ref (synchronous access)
    const getCurrentPopup = () => popupRef.current;
    
    // Wait for DOM to be ready before binding listeners
    const rafId = requestAnimationFrame(() => {
      if (isMounted) {
        cleanup = bindInlineCommentPopup(html, comments, setPopup, getCurrentPopup);
      }
    });

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      // Call cleanup function to remove event listeners
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [html, isLoading, comments]);

  useEffect(() => {
    if (!popup.visible || !popup.target) return;

    const updateVerticalPosition = () => {
      const rect = popup.target.getBoundingClientRect();
      setPopup((prev) => ({
        ...prev,
        y: rect.top,
      }));
    };

    let rafId = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateVerticalPosition();
        rafId = null;
      });
    };

    window.addEventListener("scroll", handleScroll, true);
    
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [popup.visible, popup.target]);

  const handleClose = () => {
    setPopup((prev) => ({ ...prev, visible: false, markerRef: null, target: null }));
  };

  // Open popup for a specific marker (used by bar chart click)
  const openPopupForMarker = async (markerRef, clickY = 100) => {
    // Don't reopen if already showing same marker
    const currentPopup = popupRef.current;
    if (currentPopup.visible && currentPopup.markerRef === markerRef) return;
    
    if (!markerRef || !comments || comments.length === 0) return;

    // Find the marker element in the DOM for positioning
    const markerElement = document.querySelector(`[data-marker-ref="${markerRef}"]`);
    if (!markerElement) {
      console.warn(`[CommentPopup] Marker element not found for ref: ${markerRef}`);
    }
    
    // Use shared utility to find and enrich comments
    const enriched = await getEnrichedCommentsForMarker(markerRef, comments);
    if (enriched.length === 0) return;

    // Calculate Y position from marker element if available
    let y = clickY;
    if (markerElement) {
      const rect = markerElement.getBoundingClientRect();
      y = rect.top;
    }

    setPopup({
      visible: true,
      y,
      comments: enriched,
      markerRef,
      target: markerElement,
    });
  };

  return {
    popup,
    onClose: handleClose,
    openPopupForMarker,
  };
}

