import { getUserInfo } from "../api/confluence";
import { DEFAULT_AVATAR, DATE_FORMAT } from "../constants";
import { getBaseUrl } from "./contextUtils";

/**
 * Enriches comments with user information by fetching user data for each comment author.
 * 
 * @param {Array<Object>} relatedComments - Array of comment objects to enrich
 * @returns {Promise<Array<Object>>} Array of enriched comments with user property
 */
async function enrichCommentsWithUserInfo(relatedComments) {
  return Promise.all(
    relatedComments.map(async (c) => {
      try {
        const authorId = c.version?.authorId || c.authorId;
        if (!authorId) {
          return { ...c, user: null };
        }
        const user = await getUserInfo(authorId);
        return { ...c, user };
      } catch (error) {
        return { ...c, user: null };
      }
    })
  );
}

/**
 * Calculates the popup position to align with the text line.
 * Returns viewport coordinates for use with position: fixed.
 * 
 * @param {Object} options
 * @param {number} [options.clickY] - Y coordinate of click event in viewport (for block clicks)
 * @param {HTMLElement} [options.target] - Target element (for marker clicks)
 * @returns {Object} Object with y coordinate for popup position (viewport coordinates)
 */
function calculatePopupPosition({ clickY, target }) {
  // Calculate y position in viewport coordinates (for position: fixed)
  // x position (right) is handled by CSS for horizontal responsiveness
  // Vertical position will be updated on scroll to stay aligned with text
  let y;
  if (clickY !== undefined) {
    y = clickY; // clickY is already in viewport coordinates
  } else if (target) {
    const rect = target.getBoundingClientRect();
    y = rect.top; // getBoundingClientRect returns viewport coordinates
  } else {
    y = window.scrollY || document.documentElement.scrollTop;
  }

  return { y };
}

/**
 * Opens the comment popup with enriched comments at the calculated position.
 * 
 * @param {Object} params
 * @param {Event} params.event - Click event
 * @param {string} params.markerRef - Comment marker reference ID
 * @param {Array<Object>} params.allComments - All available comments
 * @param {Function} params.setPopup - State setter for popup
 * @param {Function} params.getCurrentPopup - Function to get current popup state
 * @param {number} [params.clickY] - Optional Y coordinate for positioning
 */
async function openCommentPopup({ event, markerRef, allComments, setPopup, getCurrentPopup, clickY }) {
  event.stopPropagation();

  const currentPopup = getCurrentPopup();
  if (currentPopup.visible && currentPopup.markerRef === markerRef) {
    return;
  }

  // First, get all comments that match this markerRef
  const rootComments = allComments.filter(
    (c) => c.properties?.inlineMarkerRef === markerRef
  );
  if (rootComments.length === 0) return;

  // Build a set of root comment IDs
  const rootCommentIds = new Set(rootComments.map(c => c.id));
  
  // Recursively find all descendant comments (replies and nested replies)
  const relatedIds = new Set(rootCommentIds);
  let foundNew = true;
  
  // Keep iterating until we've found all descendants
  while (foundNew) {
    foundNew = false;
    for (const comment of allComments) {
      if (!relatedIds.has(comment.id) && comment.parentCommentId && relatedIds.has(comment.parentCommentId)) {
        relatedIds.add(comment.id);
        foundNew = true;
      }
    }
  }
  
  // Get all related comments (root + all descendants)
  const related = allComments.filter(c => relatedIds.has(c.id));

  const enriched = await enrichCommentsWithUserInfo(related);

  const position = calculatePopupPosition({ clickY, target: event.target });

  setPopup({
    visible: true,
    y: position.y,
    comments: enriched,
    markerRef: markerRef,
    target: event.target, // Store target for scroll recalculation
  });
}

/**
 * Attaches click listeners to inline comment marker elements.
 * 
 * @param {NodeList} markers - NodeList of comment marker elements
 * @param {Array<Object>} comments - All available comments
 * @param {Function} setPopup - State setter for popup
 * @param {Function} getCurrentPopup - Function to get current popup state
 * @returns {Array<{element: Element, handler: Function}>} Array of element-handler pairs for cleanup
 */
function attachMarkerListeners(markers, comments, setPopup, getCurrentPopup) {
  const handlers = [];
  markers.forEach((marker) => {
    const ref = marker.getAttribute("data-marker-ref");
    if (!ref) return;

    marker.style.cursor = "pointer";
    const handler = (e) => {
      const clickY = e.clientY !== undefined ? e.clientY : undefined;
      openCommentPopup({
        event: e,
        markerRef: ref,
        allComments: comments,
        setPopup,
        getCurrentPopup,
        clickY
      });
    };
    marker.addEventListener("click", handler);
    handlers.push({ element: marker, handler });
  });
  return handlers;
}

/**
 * Attaches click listeners to block elements containing inline comments.
 * Allows users to click anywhere on the line/block to open the popup.
 * 
 * @param {NodeList} commentedBlocks - NodeList of block elements with comments
 * @param {Array<Object>} comments - All available comments
 * @param {Function} setPopup - State setter for popup
 * @param {Function} getCurrentPopup - Function to get current popup state
 * @returns {Array<{element: Element, handler: Function}>} Array of element-handler pairs for cleanup
 */
function attachBlockListeners(commentedBlocks, comments, setPopup, getCurrentPopup) {
  const handlers = [];
  commentedBlocks.forEach((block) => {
    block.style.cursor = "pointer";
    
    const handler = (e) => {
      const markerInBlock = block.querySelector(".conf-inline-comment");
      if (markerInBlock) {
        const ref = markerInBlock.getAttribute("data-marker-ref");
        if (ref) {
          openCommentPopup({
            event: { ...e, target: markerInBlock },
            markerRef: ref,
            allComments: comments,
            setPopup,
            getCurrentPopup,
            clickY: e.clientY
          });
        }
      }
    };
    block.addEventListener("click", handler);
    handlers.push({ element: block, handler });
  });
  return handlers;
}

/**
 * Creates a cleanup function that removes all event listeners.
 * 
 * @param {Array<{element: Element, handler: Function}>} markerHandlers - Array of marker element-handler pairs
 * @param {Array<{element: Element, handler: Function}>} blockHandlers - Array of block element-handler pairs
 * @param {Function|null} documentHandler - The document click handler function to remove (if any)
 * @returns {Function} Cleanup function
 */
function createCleanupFunction(markerHandlers, blockHandlers, documentHandler) {
  return () => {
    // Remove marker event listeners
    markerHandlers.forEach(({ element, handler }) => {
      element.removeEventListener("click", handler);
      element.style.cursor = "";
    });

    // Remove block event listeners
    blockHandlers.forEach(({ element, handler }) => {
      element.removeEventListener("click", handler);
      element.style.cursor = "";
    });

    // Remove document click listener if it exists
    if (documentHandler) {
      document.removeEventListener("click", documentHandler);
    }
  };
}

/**
 * Attach click listeners to inline-comment markers and block elements,
 * and open a fixed-position popup when clicked.
 * 
 * @param {string} html - HTML content (used for validation)
 * @param {Array<Object>} comments - Array of all comment objects
 * @param {Function} setPopup - State setter function for popup state
 * @param {Function} getCurrentPopup - Function to get current popup state
 * @returns {Function|undefined} Cleanup function to remove listeners, or undefined if no setup needed
 */
export function bindInlineCommentPopup(html, comments, setPopup, getCurrentPopup) {
  if (!html || comments.length === 0) return;

  const markers = document.querySelectorAll(".conf-inline-comment");
  const commentedBlocks = document.querySelectorAll(".conf-has-comment");

  // Attach click listeners to comment markers and get handler references
  const markerHandlers = attachMarkerListeners(markers, comments, setPopup, getCurrentPopup);

  // Attach click listeners to block elements and get handler references
  const blockHandlers = attachBlockListeners(commentedBlocks, comments, setPopup, getCurrentPopup);

  // No document click listener - popup only closes when clicking another comment
  // Return cleanup function (no document listener to clean up)
  return createCleanupFunction(markerHandlers, blockHandlers, null);
}

/**
 * Converts Confluence timestamp to readable format (e.g., December 9, 2025)
 */
export function formatCommentDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString(DATE_FORMAT.LOCALE, DATE_FORMAT.OPTIONS);
  } catch {
    return "";
  }
}

/**
 * Builds the user avatar URL or returns a fallback.
 * Uses dynamic base URL extracted from the current context.
 */
export function getAvatarUrl(user) {
  const path = user?.profilePicture?.path;
  if (!path) return DEFAULT_AVATAR;

  try {
    const baseUrl = getBaseUrl();
    return `${baseUrl}${path}`;
  } catch (error) {
    // Fallback to default avatar if base URL cannot be extracted
    return DEFAULT_AVATAR;
  }
}
