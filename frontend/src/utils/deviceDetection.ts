/**
 * Device Detection Utility
 * PERFORMANCE FIX: Detect device type for mobile-specific optimizations
 */

/**
 * Detect if the current device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent) || window.innerWidth < 768;
};

/**
 * Detect if the current device is tablet
 */
export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent || '';
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
  
  return tabletRegex.test(userAgent) || (window.innerWidth >= 768 && window.innerWidth < 1024);
};

/**
 * Detect if the current connection is slow (3G/4G)
 * Uses Network Information API if available
 */
export const isSlowConnection = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (connection) {
    // Slow connection types: 2g, 3g, slow-2g
    const slowTypes = ['2g', '3g', 'slow-2g'];
    return slowTypes.includes(connection.effectiveType?.toLowerCase() || '');
  }
  
  // Default to false if API not available
  return false;
};

/**
 * Get optimal image size based on device and connection
 */
export const getOptimalImageSizeForDevice = (defaultSize: number): number => {
  if (isMobileDevice()) {
    // Reduce image size by 30-40% on mobile
    return Math.round(defaultSize * 0.65);
  }
  
  if (isSlowConnection()) {
    // Reduce image size by 20% on slow connections
    return Math.round(defaultSize * 0.8);
  }
  
  return defaultSize;
};

/**
 * Should reduce animations on mobile
 */
export const shouldReduceAnimations = (): boolean => {
  return isMobileDevice() || isSlowConnection();
};

