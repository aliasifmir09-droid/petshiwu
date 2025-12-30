/**
 * Dashboard constants - centralized configuration values
 * Makes the code more maintainable and easier to understand
 */

// Time constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
} as const;

// Query configuration constants
export const QUERY_CONFIG = {
  // Stale time (how long data is considered fresh)
  USER_DATA_STALE_TIME: TIME.FIVE_MINUTES,
  ORDER_STATS_STALE_TIME: 2 * TIME.MINUTE, // 2 minutes - order stats change more frequently
  PRODUCT_STATS_STALE_TIME: 5 * TIME.MINUTE, // 5 minutes - product stats don't change as frequently
  OUT_OF_STOCK_STALE_TIME: 2 * TIME.MINUTE, // 2 minutes - out of stock needs moderate freshness
  CATEGORIES_STALE_TIME: TIME.FIVE_MINUTES,
  PET_TYPES_STALE_TIME: TIME.FIVE_MINUTES,
  
  // Garbage collection time (how long to keep unused data in cache)
  ORDER_STATS_GC_TIME: TIME.FIVE_MINUTES,
  PRODUCT_STATS_GC_TIME: TIME.FIVE_MINUTES,
  OUT_OF_STOCK_GC_TIME: TIME.FIVE_MINUTES,
  CATEGORIES_GC_TIME: TIME.TEN_MINUTES,
  PET_TYPES_GC_TIME: TIME.TEN_MINUTES,
  
  // Refetch intervals (set to false to disable automatic polling)
  ORDER_STATS_REFETCH_INTERVAL: 2 * TIME.MINUTE, // Poll every 2 minutes instead of 20 seconds
} as const;

// UI constants
export const UI = {
  // Skeleton loader counts
  STATS_CARDS_SKELETON_COUNT: 4,
  OUT_OF_STOCK_SKELETON_COUNT: 3,
  RECENT_ORDERS_SKELETON_COUNT: 5,
  
  // Chart configuration
  CHART_HEIGHT: 300,
  MONTHS_TO_DISPLAY: 6,
  TOP_CATEGORIES_COUNT: 15,
  
  // Out of stock display
  OUT_OF_STOCK_DISPLAY_LIMIT: 5,
  OUT_OF_STOCK_FETCH_LIMIT: 10,
  
  // Icon sizes
  ICON_SIZE_SMALL: 14,
  ICON_SIZE_MEDIUM: 18,
  ICON_SIZE_LARGE: 20,
  ICON_SIZE_XLARGE: 24,
  ICON_SIZE_XXLARGE: 28,
  
  // Spacing and sizing
  HEADER_DECORATIVE_CIRCLE_LARGE: 64,
  HEADER_DECORATIVE_CIRCLE_MEDIUM: 48,
  HEADER_DECORATIVE_CIRCLE_SMALL: 32,
  PRODUCT_IMAGE_SIZE: 14,
  CATEGORY_ICON_SIZE: 4,
  EMPTY_STATE_ICON_SIZE: 48,
  
  // Grid columns
  STATS_GRID_COLS_MOBILE: 1,
  STATS_GRID_COLS_TABLET: 2,
  STATS_GRID_COLS_DESKTOP: 4,
  CHARTS_GRID_COLS_MOBILE: 1,
  CHARTS_GRID_COLS_DESKTOP: 2,
  CATEGORIES_GRID_COLS_MOBILE: 1,
  CATEGORIES_GRID_COLS_TABLET: 2,
  CATEGORIES_GRID_COLS_DESKTOP: 3,
} as const;

// Chart margins
export const CHART_MARGINS = {
  TOP: 5,
  RIGHT: 30,
  LEFT: 20,
  BOTTOM: 60,
} as const;

// Month names
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

