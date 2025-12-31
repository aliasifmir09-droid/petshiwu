/**
 * Search history utility for managing search history in localStorage
 * Falls back to localStorage if API is unavailable
 */

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 20;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  filters?: {
    category?: string;
    petType?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
  };
}

/**
 * Get search history from localStorage
 */
export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];
    const history = JSON.parse(stored) as SearchHistoryItem[];
    return history.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  } catch (error) {
    console.warn('Failed to get search history from localStorage:', error);
    return [];
  }
};

/**
 * Add search to history
 */
export const addToSearchHistory = (query: string, filters?: SearchHistoryItem['filters']): void => {
  try {
    const history = getSearchHistory();
    
    // Remove duplicate queries (keep most recent)
    const filteredHistory = history.filter((item) => item.query.toLowerCase() !== query.toLowerCase());
    
    // Add new search at the beginning
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      filters,
    };
    
    const updatedHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.warn('Failed to save search history to localStorage:', error);
  }
};

/**
 * Remove search from history
 */
export const removeFromSearchHistory = (query: string): void => {
  try {
    const history = getSearchHistory();
    const filteredHistory = history.filter((item) => item.query.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.warn('Failed to remove search from history:', error);
  }
};

/**
 * Clear all search history
 */
export const clearSearchHistory = (): void => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.warn('Failed to clear search history:', error);
  }
};

/**
 * Get recent searches (last N items)
 */
export const getRecentSearches = (limit: number = 10): SearchHistoryItem[] => {
  return getSearchHistory().slice(0, limit);
};

