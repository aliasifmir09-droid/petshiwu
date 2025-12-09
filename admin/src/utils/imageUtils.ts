/**
 * Normalizes image URLs to full URLs
 * - If already a full URL (http/https), returns as-is (including Cloudinary URLs)
 * - Cloudinary URLs are preferred and returned as-is
 * - Otherwise returns a placeholder or fallback
 */
export const normalizeImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl) {
    return getPlaceholderImage();
  }

  // Already a full URL (http:// or https://) - includes Cloudinary URLs
  // In production, only allow HTTPS for security
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('http://')) {
    if (isProduction) {
      // In production, reject HTTP URLs for security (mixed content)
      console.warn('HTTP image URL rejected in production:', imageUrl);
      return getPlaceholderImage();
    }
    // In development, allow HTTP for local testing
    return imageUrl;
  }

  // Fallback to placeholder for invalid URLs
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
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackText?: string) => {
  const img = e.currentTarget;
  img.src = getPlaceholderImage(fallbackText || 'Image Not Available');
};

/**
 * Checks if an image URL is valid/exists
 * In production, only HTTPS URLs are allowed
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  if (url.startsWith('https://')) {
    return true;
  }
  
  // In production, reject HTTP URLs
  if (isProduction && url.startsWith('http://')) {
    return false;
  }
  
  // In development, allow HTTP for local testing
  return url.startsWith('http://');
};

