/**
 * Analytics utility for tracking user events
 * Supports Google Analytics 4 (GA4) and custom event tracking
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Google Analytics Measurement ID (set via environment variable)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

/**
 * Initialize Google Analytics
 */
export const initAnalytics = () => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    return;
  }

  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Initialize gtag
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  window.gtag = function(...args: any[]) {
    if (window.dataLayer) {
      window.dataLayer.push(args);
    }
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname + window.location.search,
  });
};

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title,
    });
  }
  
  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] Page view:', path);
  }
};

/**
 * Track custom event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: {
    category?: string;
    action?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  }
) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
  
  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] Event:', eventName, eventParams);
  }
};

/**
 * Track product view
 */
export const trackProductView = (productId: string, productName: string, category?: string) => {
  trackEvent('view_item', {
    category: 'ecommerce',
    action: 'view_item',
    item_id: productId,
    item_name: productName,
    item_category: category,
  });
};

/**
 * Track add to cart
 */
export const trackAddToCart = (productId: string, productName: string, price: number, quantity: number = 1) => {
  trackEvent('add_to_cart', {
    category: 'ecommerce',
    action: 'add_to_cart',
    item_id: productId,
    item_name: productName,
    value: price,
    quantity: quantity,
  });
};

/**
 * Track remove from cart
 */
export const trackRemoveFromCart = (productId: string, productName: string) => {
  trackEvent('remove_from_cart', {
    category: 'ecommerce',
    action: 'remove_from_cart',
    item_id: productId,
    item_name: productName,
  });
};

/**
 * Track purchase
 */
export const trackPurchase = (
  transactionId: string,
  value: number,
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>
) => {
  trackEvent('purchase', {
    category: 'ecommerce',
    action: 'purchase',
    transaction_id: transactionId,
    value: value,
    items: items,
  });
};

/**
 * Track search
 */
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  trackEvent('search', {
    category: 'search',
    action: 'search',
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

/**
 * Track user registration
 */
export const trackSignUp = (method: 'email' | 'social' = 'email') => {
  trackEvent('sign_up', {
    category: 'user',
    action: 'sign_up',
    method: method,
  });
};

/**
 * Track user login
 */
export const trackLogin = (method: 'email' | 'social' = 'email') => {
  trackEvent('login', {
    category: 'user',
    action: 'login',
    method: method,
  });
};

/**
 * Track wishlist add
 */
export const trackAddToWishlist = (productId: string, productName: string) => {
  trackEvent('add_to_wishlist', {
    category: 'ecommerce',
    action: 'add_to_wishlist',
    item_id: productId,
    item_name: productName,
  });
};

/**
 * Track product comparison
 */
export const trackProductComparison = (productIds: string[]) => {
  trackEvent('compare_products', {
    category: 'ecommerce',
    action: 'compare',
    item_ids: productIds,
  });
};

/**
 * Track share
 */
export const trackShare = (method: 'facebook' | 'twitter' | 'email' | 'copy', contentType: 'product' | 'wishlist', contentId?: string) => {
  trackEvent('share', {
    category: 'social',
    action: 'share',
    method: method,
    content_type: contentType,
    content_id: contentId,
  });
};

/**
 * Track remove from wishlist
 */
export const trackRemoveFromWishlist = (productId: string, productName: string) => {
  trackEvent('remove_from_wishlist', {
    category: 'ecommerce',
    action: 'remove_from_wishlist',
    item_id: productId,
    item_name: productName,
  });
};

/**
 * Track category view
 */
export const trackViewCategory = (categoryId: string, categoryName: string, petType?: string) => {
  trackEvent('view_item_list', {
    category: 'ecommerce',
    action: 'view_item_list',
    item_list_id: categoryId,
    item_list_name: categoryName,
    pet_type: petType,
  });
};

/**
 * Track filter usage
 */
export const trackFilterProducts = (filters: {
  petType?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
}) => {
  trackEvent('filter_products', {
    category: 'ecommerce',
    action: 'filter',
    ...filters,
  });
};

/**
 * Track checkout start
 */
export const trackBeginCheckout = (value: number, itemsCount: number) => {
  trackEvent('begin_checkout', {
    category: 'ecommerce',
    action: 'begin_checkout',
    value: value,
    items_count: itemsCount,
  });
};

/**
 * Track order cancellation
 */
export const trackOrderCancel = (orderId: string, value: number) => {
  trackEvent('cancel_order', {
    category: 'ecommerce',
    action: 'cancel_order',
    transaction_id: orderId,
    value: value,
  });
};

/**
 * Track return request
 */
export const trackReturnRequest = (orderId: string, returnId: string, itemsCount: number) => {
  trackEvent('return_request', {
    category: 'ecommerce',
    action: 'return_request',
    transaction_id: orderId,
    return_id: returnId,
    items_count: itemsCount,
  });
};

/**
 * Track review submission
 */
export const trackReviewSubmit = (productId: string, productName: string, rating: number) => {
  trackEvent('review_submit', {
    category: 'ecommerce',
    action: 'review_submit',
    item_id: productId,
    item_name: productName,
    rating: rating,
  });
};

/**
 * Track email verification
 */
export const trackEmailVerification = (method: 'verify' | 'resend') => {
  trackEvent('email_verification', {
    category: 'user',
    action: method === 'verify' ? 'verify_email' : 'resend_verification',
  });
};

/**
 * Track password reset
 */
export const trackPasswordReset = (action: 'request' | 'complete') => {
  trackEvent('password_reset', {
    category: 'user',
    action: action === 'request' ? 'request_password_reset' : 'complete_password_reset',
  });
};

/**
 * Track address management
 */
export const trackAddressAction = (action: 'add' | 'edit' | 'delete' | 'set_default') => {
  trackEvent('address_management', {
    category: 'user',
    action: action,
  });
};

/**
 * Track stock alert
 */
export const trackStockAlert = (action: 'create' | 'delete', productId: string, productName: string) => {
  trackEvent('stock_alert', {
    category: 'ecommerce',
    action: action,
    item_id: productId,
    item_name: productName,
  });
};

