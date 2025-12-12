/**
 * Reusable StatusMessage component for navigation, error, and loading states.
 * Displays a simple message in a container with consistent styling.
 *
 * @param {Object} props - Component props
 * @param {string} props.message - The message to display
 */
export function StatusMessage({ message }) {
  return (
    <div className="conf-container">{message}</div>
  );
}