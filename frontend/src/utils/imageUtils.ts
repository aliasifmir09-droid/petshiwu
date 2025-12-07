import { API_URL } from '@/services/api';

/**
 * Normalizes image URLs to full URLs
 * - If already a full URL (http/https), returns as-is (including Cloudinary URLs)
 * - If relative path starting with /uploads, prepends backend API URL
 * - Otherwise returns a placeholder or fallback
 */
export const normalizeImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl) {
    return getPlaceholderImage();
  }

  // Already a full URL (http:// or https://) - includes Cloudinary URLs
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Relative path starting with /uploads
  if (imageUrl.startsWith('/uploads/')) {
    // Get backend URL without /api suffix
    const backendUrl = API_URL.replace(/\/api$/, '');
    return `${backendUrl}${imageUrl}`;
  }

  // Relative path without leading slash
  if (imageUrl.startsWith('uploads/')) {
    const backendUrl = API_URL.replace(/\/api$/, '');
    return `${backendUrl}/${imageUrl}`;
  }

  // Fallback to placeholder
  return getPlaceholderImage();
};

/**
 * Gets a placeholder image URL using SVG data URI (no external requests)
 */
export const getPlaceholderImage = (text: string = 'Product Image'): string => {
  // Use SVG data URI - always available, no external requests
  const svg = `
    <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="500" height="500" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#6b7280" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `.trim().replace(/\s+/g, ' ');
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Creates an image error handler that sets a fallback placeholder
 * Handles 403 Forbidden, 404 Not Found, and other image loading errors
 * Silently handles errors without logging to console
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackText?: string) => {
  const img = e.currentTarget;
  
  // Prevent infinite loop if placeholder also fails
  if (img.src && (img.src.startsWith('data:image/svg+xml') || img.src.includes('placeholder'))) {
    return;
  }
  
  // Set placeholder image silently
  try {
    img.src = getPlaceholderImage(fallbackText || 'Image Not Available');
    // Remove error listener to prevent further errors
    img.onerror = null;
  } catch (err) {
    // Silently fail - don't log errors
  }
  
  // Prevent error from bubbling and suppress console errors
  e.stopPropagation();
  e.preventDefault();
  
  // Suppress the error in console by overriding the error event
  if (e.nativeEvent) {
    e.nativeEvent.stopImmediatePropagation();
  }
};

/**
 * Checks if an image URL is valid/exists
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/uploads/');
};

