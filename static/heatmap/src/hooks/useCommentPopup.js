import { useEffect, useState, useRef, useCallback } from "react";
import { markCommentedBlocks } from "../utils/htmlProcessing";
import { bindInlineCommentPopup, getEnrichedCommentsForMarker } from "../utils/commentPopup";

// Timeout constants for popup operations
// These values account for CSS backdrop-filter rendering time
const CLOSE_LOCK_DURATION_MS = 350; // Time to wait after close before allowing new opens
const OPEN_LOCK_RELEASE_MS = 50;    // Time to wait after open state update before releasing lock

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
  
  // Processing lock to prevent concurrent popup operations
  const isProcessingRef = useRef(false);
  
  // Operation ID to track async operations and detect stale completions
  const operationIdRef = useRef(0);
  
  // Track pending timeouts for cleanup on unmount (using Set for efficient add/delete)
  const timeoutIdsRef = useRef(new Set());

  // Cleanup pending timeouts on unmount to prevent memory leaks
  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds.clear();
    };
  }, []);

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

  const handleClose = useCallback(() => {
    // Set processing lock to prevent race conditions
    isProcessingRef.current = true;
    
    setPopup((prev) => ({ ...prev, visible: false, markerRef: null, target: null }));
    
    // Release lock after CSS backdrop-filter has settled
    const timeoutId = setTimeout(() => {
      isProcessingRef.current = false;
      timeoutIdsRef.current.delete(timeoutId);
    }, CLOSE_LOCK_DURATION_MS);
    
    timeoutIdsRef.current.add(timeoutId);
  }, []);

  // Close popup when clicking outside the active comment block or popup
  useEffect(() => {
    if (!popup.visible) return;

    const handleClickOutside = (event) => {
      // Don't close if clicking inside the popup
      const popupElement = document.querySelector('.conf-comment-popup');
      if (popupElement && popupElement.contains(event.target)) {
        return;
      }

      // Don't close if clicking inside the active comment block
      const activeBlock = document.querySelector('.conf-has-comment-active');
      if (activeBlock && activeBlock.contains(event.target)) {
        return;
      }

      // Don't close if clicking on another comment marker (let it switch popups)
      const clickedMarker = event.target.closest('.conf-inline-comment');
      if (clickedMarker) {
        return;
      }

      // Don't close if clicking on another commented block (let it switch popups)
      const clickedBlock = event.target.closest('.conf-has-comment');
      if (clickedBlock) {
        return;
      }

      // Don't close if clicking in the sidebar (chart area) or any sidebar-related elements
      if (
        event.target.closest('.conf-sidebar') ||
        event.target.closest('.conf-sidebar-toggle') ||
        event.target.closest('.conf-sidebar-checkbox') ||
        event.target.classList.contains('conf-sidebar-checkbox') ||
        event.target.id === 'conf-sidebar-toggle'
      ) {
        return;
      }

      // Close the popup for clicks outside
      handleClose();
    };

    // Use capture phase to handle click before other handlers
    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [popup.visible, popup.markerRef, handleClose]);

  // Effect to manage focus styling on the active conf-has-comment element
  // Adds 'conf-has-comment-active' class to the block containing the open popup's marker
  useEffect(() => {
    // Helper to clear all focus styling
    const clearFocusStyling = () => {
      document.querySelectorAll('.conf-has-comment-active').forEach(el => {
        el.classList.remove('conf-has-comment-active');
      });
      document.body.classList.remove('conf-popup-open');
    };

    if (!popup.visible || !popup.markerRef) {
      clearFocusStyling();
      // Always return cleanup even when not adding classes
      return clearFocusStyling;
    }

    // Find the marker element and its parent block
    const markerElement = document.querySelector(`[data-marker-ref="${popup.markerRef}"]`);
    if (!markerElement) {
      return clearFocusStyling;
    }

    const parentBlock = markerElement.closest('.conf-has-comment');
    if (!parentBlock) {
      return clearFocusStyling;
    }

    // Remove active class from all other blocks first
    clearFocusStyling();

    // Add active class to the current block
    parentBlock.classList.add('conf-has-comment-active');
    document.body.classList.add('conf-popup-open');

    return clearFocusStyling;
  }, [popup.visible, popup.markerRef]);

  // Open popup for a specific marker (used by bar chart click)
  const openPopupForMarker = useCallback(async (markerRef) => {
    // Skip if currently processing another operation (prevents race conditions)
    if (isProcessingRef.current) return;
    
    // Don't reopen if already showing same marker
    const currentPopup = popupRef.current;
    if (currentPopup.visible && currentPopup.markerRef === markerRef) return;
    
    if (!markerRef || !comments || comments.length === 0) return;

    // Set processing lock and increment operation ID before async operation
    isProcessingRef.current = true;
    operationIdRef.current += 1;
    const currentOperationId = operationIdRef.current;

    // Find the marker element in the DOM for positioning
    const markerElement = document.querySelector(`[data-marker-ref="${markerRef}"]`);
    if (!markerElement) {
      console.warn(`[CommentPopup] Marker element not found for ref: ${markerRef}`);
      isProcessingRef.current = false;
      return;
    }
    
    // Use shared utility to find and enrich comments
    let enriched;
    try {
      enriched = await getEnrichedCommentsForMarker(markerRef, comments);
    } catch (error) {
      console.error(`[CommentPopup] Failed to enrich comments:`, error);
      isProcessingRef.current = false;
      return;
    }
    
    // Check if this operation is still the active one (another operation might have started)
    if (currentOperationId !== operationIdRef.current) {
      // A newer operation has started, abandon this one silently
      return;
    }
    
    if (enriched.length === 0) {
      isProcessingRef.current = false;
      return;
    }

    // Calculate Y position from marker element
    const rect = markerElement.getBoundingClientRect();
    const y = rect.top;

    setPopup({
      visible: true,
      y,
      comments: enriched,
      markerRef,
      target: markerElement,
    });
    
    // Release lock after state update has been scheduled
    const timeoutId = setTimeout(() => {
      isProcessingRef.current = false;
      timeoutIdsRef.current.delete(timeoutId);
    }, OPEN_LOCK_RELEASE_MS);
    
    timeoutIdsRef.current.add(timeoutId);
  }, [comments]);

  return {
    popup,
    onClose: handleClose,
    openPopupForMarker,
  };
}

