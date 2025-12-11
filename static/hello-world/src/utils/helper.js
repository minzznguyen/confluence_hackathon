import { getUserInfo } from "../api/confluence";
import { BASE_URL, DEFAULT_AVATAR } from "../constants";

/**
 * Attach click listeners to inline-comment markers
 * and open a fixed-position popup.
 */
export function bindInlineCommentPopup(html, comments, setPopup) {
  if (!html || comments.length === 0) return;

  const markers = document.querySelectorAll(".conf-inline-comment");

  async function openPopup(event, markerRef) {
    event.stopPropagation();

    const target = event.target;
    const related = comments.filter(
      (c) => c.properties?.inlineMarkerRef === markerRef
    );
    if (related.length === 0) return;

    // Fetch user info for each comment
    const enriched = await Promise.all(
      related.map(async (c) => {
        const user = await getUserInfo(c.version.authorId);
        return { ...c, user };
      })
    );

    // Calculate position
    const rect = target.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    const popupWidth = 360;
    const rightMargin = 56;

    // Horizontal position
    const left = window.innerWidth - popupWidth - rightMargin;

    // Vertical position
    const top = rect.top + scrollTop;

    setPopup({
      visible: true,
      x: left,
      y: top,
      comments: enriched
    });
  }

  function closePopup() {
    setPopup((prev) => ({ ...prev, visible: false }));
  }

  markers.forEach((el) => {
    const ref = el.getAttribute("data-ref");
    if (!ref) return;

    el.style.cursor = "pointer";
    el.addEventListener("click", (e) => openPopup(e, ref));
  });

  document.addEventListener("click", closePopup);

  return () => {
    markers.forEach((el) => {
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
    });

    document.removeEventListener("click", closePopup);
  };
}

/**
 * Safely extracts comment text from atlas_doc_format JSON.
 */
export function extractCommentText(comment) {
  try {
    const raw = comment.body?.atlas_doc_format?.value;
    if (!raw) return "(empty)";

    const doc = JSON.parse(raw);
    return doc.content?.[0]?.content?.[0]?.text ?? "(empty)";
  } catch {
    return "(empty)";
  }
}

/**
 * Converts Confluence timestamp to readable format (e.g., December 9, 2025)
 */
export function formatCommentDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return "";
  }
}

/**
 * Builds the user avatar URL or returns a fallback.
 */
export function getAvatarUrl(user) {
  const path = user?.profilePicture?.path;
  if (!path) return DEFAULT_AVATAR;

  return `${BASE_URL}${path}`;
}
