/**
 * Simple memoization utility for pure functions.
 * Caches results based on serialized arguments to prevent redundant computations.
 * 
 * @param {Function} fn - Pure function to memoize
 * @param {Function} [keyGenerator] - Optional function to generate cache key from arguments
 * @returns {Function} Memoized version of the function
 * 
 * @example
 * const expensiveFunction = (comments, status) => {
 *   // expensive computation
 *   return result;
 * };
 * const memoized = memoize(expensiveFunction, (comments, status) => 
 *   `${comments.length}-${status}`
 * );
 */
export function memoize(fn, keyGenerator = null) {
  const cache = new Map();

  return function (...args) {
    // Generate cache key
    let key;
    if (keyGenerator) {
      key = keyGenerator(...args);
    } else {
      // Default: serialize arguments (works for primitives and arrays)
      key = JSON.stringify(args);
    }

    // Return cached result if available
    if (cache.has(key)) {
      return cache.get(key);
    }

    // Compute and cache result
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Creates a cache key from comments array and options object.
 * Uses comment IDs and status to create a stable key.
 * 
 * @param {Array} comments - Array of comment objects
 * @param {Object} options - Options object (e.g., { status: 'open' })
 * @returns {string} Cache key
 */
export function createCommentCacheKey(comments, options = {}) {
  if (!comments || comments.length === 0) {
    return `empty-${JSON.stringify(options)}`;
  }
  
  // Create stable key from comment IDs and options
  const commentIds = comments.map(c => c.id).sort().join(',');
  const optionsKey = JSON.stringify(options);
  return `${commentIds.length}-${commentIds.slice(0, 50)}-${optionsKey}`;
}

