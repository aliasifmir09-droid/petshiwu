/**
 * Data validation utilities for API responses
 * Provides runtime validation to prevent crashes from unexpected data structures
 */

/**
 * Validates OrderStats structure
 */
export const validateOrderStats = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  // Check that numeric fields are numbers or undefined
  const numericFields = ['totalOrders', 'pendingOrders', 'totalRevenue', 'revenueTrend', 'ordersTrend'];
  for (const field of numericFields) {
    if (data[field] !== undefined && typeof data[field] !== 'number') {
      return false;
    }
  }
  
  // Check monthlySales is array if present
  if (data.monthlySales !== undefined && !Array.isArray(data.monthlySales)) {
    return false;
  }
  
  // Check recentOrders is array if present
  if (data.recentOrders !== undefined && !Array.isArray(data.recentOrders)) {
    return false;
  }
  
  return true;
};

/**
 * Validates ProductStats structure
 */
export const validateProductStats = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  // Check that numeric fields are numbers or undefined
  const numericFields = ['totalProducts', 'outOfStockProducts', 'featuredProducts'];
  for (const field of numericFields) {
    if (data[field] !== undefined && typeof data[field] !== 'number') {
      return false;
    }
  }
  
  return true;
};

/**
 * Validates RecentOrder structure
 */
export const validateRecentOrder = (order: any): boolean => {
  if (!order || typeof order !== 'object') return false;
  
  // At minimum, should have an ID or orderNumber
  if (!order._id && !order.orderNumber) return false;
  
  // If user exists, should be an object
  if (order.user !== undefined && (typeof order.user !== 'object' || order.user === null)) {
    return false;
  }
  
  return true;
};

/**
 * Validates Product structure
 */
export const validateProduct = (product: any): boolean => {
  if (!product || typeof product !== 'object') return false;
  
  // Should have at least an ID or name
  if (!product._id && !product.name) return false;
  
  // If images exists, should be an array
  if (product.images !== undefined && !Array.isArray(product.images)) {
    return false;
  }
  
  return true;
};

/**
 * Validates array of items with a validator function
 */
export const validateArray = <T>(arr: any, validator: (item: any) => boolean): arr is T[] => {
  if (!Array.isArray(arr)) return false;
  return arr.every(validator);
};

/**
 * Safely validates and returns data or undefined
 */
export const safeValidate = <T>(data: any, validator: (data: any) => boolean): T | undefined => {
  return validator(data) ? data as T : undefined;
};

