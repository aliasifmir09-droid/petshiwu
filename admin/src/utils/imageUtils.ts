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
 * Gets a placeholder image URL
 */
export const getPlaceholderImage = (text: string = 'Product Image'): string => {
  // Use a reliable placeholder service
  return `https://via.placeholder.com/500x500/cccccc/ffffff?text=${encodeURIComponent(text)}`;
};

/**
 * Creates an image error handler that sets a fallback placeholder
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackText?: string) => {
  const img = e.currentTarget;
  img.src = getPlaceholderImage(fallbackText || 'Image Not Available');
};

/**
 * Checks if an image URL is valid/exists
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/uploads/');
};

