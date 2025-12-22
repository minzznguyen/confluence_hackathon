import { getUserInfo } from '../api/confluence';
import { getAvatarUrl } from './commentPopup';

/**
 * User Info Cache Service
 * Prevents redundant API calls by caching user information and deduplicating
 * concurrent requests for the same user.
 * 
 * This cache is particularly useful when multiple components need the same
 * user information (e.g., charts and popups fetching info for the same users).
 */
class UserInfoCache {
  constructor() {
    // Cache of user ID -> user data object
    this.cache = new Map();
    
    // Map of user ID -> pending Promise (prevents duplicate concurrent requests)
    this.pendingRequests = new Map();
  }

  /**
   * Gets user information for a single account ID.
   * Returns cached value if available, or fetches and caches if not.
   * Prevents duplicate concurrent requests for the same user.
   * 
   * @param {string} accountId - User account ID
   * @returns {Promise<Object>} User data object with displayName, avatarUrl, etc.
   */
  async getUserInfo(accountId) {
    if (!accountId) {
      return null;
    }

    // Return cached value if available
    if (this.cache.has(accountId)) {
      return this.cache.get(accountId);
    }

    // Return pending promise if request already in flight (prevents duplicate requests)
    if (this.pendingRequests.has(accountId)) {
      return this.pendingRequests.get(accountId);
    }

    // Create new request and cache the promise
    const promise = getUserInfo(accountId)
      .then(user => {
        // Cache the result
        this.cache.set(accountId, user);
        // Remove from pending requests
        this.pendingRequests.delete(accountId);
        return user;
      })
      .catch(error => {
        // Remove from pending requests on error (allow retry)
        this.pendingRequests.delete(accountId);
        // Return null user object to prevent breaking the UI
        const nullUser = null;
        this.cache.set(accountId, nullUser); // Cache null to prevent retry loops
        return nullUser;
      });

    // Store pending promise
    this.pendingRequests.set(accountId, promise);
    return promise;
  }

  /**
   * Gets user information for multiple account IDs efficiently.
   * Deduplicates IDs and batches requests, reusing cached values where available.
   * 
   * @param {Array<string>} accountIds - Array of user account IDs
   * @returns {Promise<Array<Object>>} Array of user data objects in same order as input
   */
  async getMultipleUserInfo(accountIds) {
    if (!accountIds || accountIds.length === 0) {
      return [];
    }

    // Filter out null/undefined IDs and deduplicate
    const uniqueIds = [...new Set(accountIds.filter(id => id !== null && id !== undefined))];
    
    // Fetch all unique users in parallel
    const userPromises = uniqueIds.map(id => this.getUserInfo(id));
    const users = await Promise.all(userPromises);
    
    // Create a map for quick lookup
    const userMap = new Map();
    uniqueIds.forEach((id, index) => {
      userMap.set(id, users[index]);
    });
    
    // Return results in the same order as input (including nulls for null IDs)
    return accountIds.map(id => {
      if (id === null || id === undefined) {
        return null;
      }
      return userMap.get(id) || null;
    });
  }

  /**
   * Gets enriched user info (with displayName and avatarUrl) for a single account ID.
   * Convenience method that combines getUserInfo with avatar URL generation.
   * 
   * @param {string} accountId - User account ID
   * @returns {Promise<Object>} Object with userId, displayName, and avatarUrl
   */
  async getEnrichedUserInfo(accountId) {
    if (!accountId) {
      return {
        userId: null,
        displayName: 'Unknown User',
        avatarUrl: null,
      };
    }

    try {
      const user = await this.getUserInfo(accountId);
      return {
        userId: accountId,
        displayName: user?.displayName || 'Unknown User',
        avatarUrl: user ? getAvatarUrl(user) : null,
      };
    } catch {
      return {
        userId: accountId,
        displayName: 'Unknown User',
        avatarUrl: null,
      };
    }
  }

  /**
   * Gets enriched user info for multiple account IDs.
   * Returns array of objects with userId, displayName, and avatarUrl.
   * 
   * @param {Array<string>} accountIds - Array of user account IDs
   * @returns {Promise<Array<Object>>} Array of enriched user info objects
   */
  async getMultipleEnrichedUserInfo(accountIds) {
    if (!accountIds || accountIds.length === 0) {
      return [];
    }

    // Filter out null/undefined IDs and deduplicate
    const uniqueIds = [...new Set(accountIds.filter(id => id !== null && id !== undefined))];
    
    // Fetch all unique users in parallel
    const enrichedPromises = uniqueIds.map(id => this.getEnrichedUserInfo(id));
    const enrichedUsers = await Promise.all(enrichedPromises);
    
    // Create a map for quick lookup
    const enrichedMap = new Map();
    uniqueIds.forEach((id, index) => {
      enrichedMap.set(id, enrichedUsers[index]);
    });
    
    // Return results in the same order as input (including nulls for null IDs)
    return accountIds.map(id => {
      if (id === null || id === undefined) {
        return null;
      }
      const enriched = enrichedMap.get(id);
      return enriched || {
        userId: id,
        displayName: 'Unknown User',
        avatarUrl: null,
      };
    });
  }

  /**
   * Clears the cache (useful for testing or memory management).
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Gets the current cache size (useful for debugging).
   * @returns {number} Number of cached users
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Export a singleton instance
export const userCache = new UserInfoCache();

