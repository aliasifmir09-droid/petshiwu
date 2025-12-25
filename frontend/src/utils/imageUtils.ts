import { API_URL } from '@/services/api';

/**
 * Image size presets for different use cases
 */
export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'xlarge';

const IMAGE_SIZES: Record<ImageSize, number> = {
  thumbnail: 150,
  small: 300,
  medium: 500,
  large: 800,
  xlarge: 1200
};

/**
 * Optimizes Cloudinary image URL with size and format transformations
 */
const optimizeCloudinaryUrl = (url: string, width?: number, height?: number, format?: 'webp' | 'avif' | 'auto'): string => {
  // Check if it's a Cloudinary URL
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  // Parse existing URL to preserve path
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the upload index (usually after /upload/)
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
      return url; // Not a standard Cloudinary URL
    }

    // Build transformation parameters
    const transformations: string[] = [];
    
    // Add size transformations
    if (width) {
      transformations.push(`w_${width}`);
    }
    if (height) {
      transformations.push(`h_${height}`);
    }
    
    // Add format (WebP/AVIF)
    if (format === 'webp') {
      transformations.push('f_webp');
    } else if (format === 'avif') {
      transformations.push('f_avif');
    } else if (format === 'auto' || !format) {
      transformations.push('f_auto'); // Auto-optimize format
    }
    
    // Add quality optimization
    transformations.push('q_auto');
    
    // Add crop mode
    if (width || height) {
      transformations.push('c_limit'); // Maintain aspect ratio
    }

    // Insert transformations after /upload/
    if (transformations.length > 0) {
      const transformString = transformations.join(',');
      pathParts.splice(uploadIndex + 1, 0, transformString);
    }

    urlObj.pathname = pathParts.join('/');
    return urlObj.toString();
  } catch {
    return url; // If URL parsing fails, return original
  }
};

/**
 * Optimizes Adobe Scene7 image URL with size parameters
 * Scene7 URLs typically have wid=2000&hei=2000, we need to reduce this
 */
const optimizeScene7Url = (url: string, width?: number, height?: number): string => {
  if (!url.includes('scene7.com')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    
    // Always override width and height - Scene7 defaults to 2000x2000 which is too large
    // Default to 400x400 if not specified (good for product cards)
    const targetWidth = width || 400;
    const targetHeight = height || 400;
    
    urlObj.searchParams.set('wid', targetWidth.toString());
    urlObj.searchParams.set('hei', targetHeight.toString());
    
    // Add format optimization (WebP if supported)
    urlObj.searchParams.set('fmt', 'webp');
    urlObj.searchParams.set('qlt', '85'); // Quality 85% (good balance)
    
    return urlObj.toString();
  } catch {
    return url;
  }
};

/**
 * Optimizes Unsplash image URL with size parameters
 */
const optimizeUnsplashUrl = (url: string, width?: number, height?: number): string => {
  if (!url.includes('unsplash.com')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    
    // Update width and height parameters
    if (width) {
      urlObj.searchParams.set('w', width.toString());
    }
    if (height) {
      urlObj.searchParams.set('h', height.toString());
    }
    
    // Add quality optimization
    urlObj.searchParams.set('q', '80');
    urlObj.searchParams.set('fit', 'crop');
    
    return urlObj.toString();
  } catch {
    return url;
  }
};

/**
 * Normalizes and optimizes image URLs with size transformations
 * - If already a full URL (http/https), optimizes it based on provider
 * - If relative path starting with /uploads, prepends backend API URL
 * - Otherwise returns a placeholder or fallback
 */
export const normalizeImageUrl = (
  imageUrl: string | undefined | null,
  options?: {
    width?: number;
    height?: number;
    size?: ImageSize;
    format?: 'webp' | 'avif' | 'auto';
  }
): string => {
  if (!imageUrl) {
    return getPlaceholderImage();
  }

  const { width, height, size, format = 'auto' } = options || {};
  const finalWidth = width || (size ? IMAGE_SIZES[size] : undefined);
  const finalHeight = height;

  // Already a full URL (http:// or https://) - optimize based on provider
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  if (imageUrl.startsWith('https://')) {
    // Optimize based on image provider
    if (imageUrl.includes('res.cloudinary.com')) {
      return optimizeCloudinaryUrl(imageUrl, finalWidth, finalHeight, format);
    }
    if (imageUrl.includes('scene7.com')) {
      return optimizeScene7Url(imageUrl, finalWidth, finalHeight);
    }
    if (imageUrl.includes('unsplash.com')) {
      return optimizeUnsplashUrl(imageUrl, finalWidth, finalHeight);
    }
    return imageUrl;
  }
  
  if (imageUrl.startsWith('http://')) {
    if (isProduction) {
      console.warn('HTTP image URL rejected in production:', imageUrl);
      return getPlaceholderImage();
    }
    return imageUrl;
  }

  // Relative path starting with /uploads
  if (imageUrl.startsWith('/uploads/')) {
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
 * Gets optimized image URL with explicit options
 * This is a convenience wrapper around normalizeImageUrl with better defaults
 */
export const getOptimizedImageUrl = (
  imageUrl: string | undefined | null,
  options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'auto';
    quality?: 'auto' | number;
  } = {}
): string => {
  return normalizeImageUrl(imageUrl, {
    width: options.width,
    height: options.height,
    format: options.format || 'auto'
  });
};

/**
 * Generates responsive image srcset for different screen sizes
 */
export const generateSrcSet = (
  imageUrl: string | undefined | null,
  sizes: number[] = [300, 500, 800, 1200],
  options: Omit<Parameters<typeof getOptimizedImageUrl>[1], 'width' | 'height'> = {}
): string => {
  if (!imageUrl) {
    return '';
  }

  return sizes
    .map(size => {
      const optimizedUrl = getOptimizedImageUrl(imageUrl, { ...options, width: size, height: size });
      return `${optimizedUrl} ${size}w`;
    })
    .join(', ');
};

/**
 * Gets the appropriate image size based on display dimensions
 */
export const getOptimalImageSize = (displayWidth: number, displayHeight?: number): ImageSize => {
  const maxDimension = displayHeight ? Math.max(displayWidth, displayHeight) : displayWidth;
  
  if (maxDimension <= 200) return 'thumbnail';
  if (maxDimension <= 400) return 'small';
  if (maxDimension <= 600) return 'medium';
  if (maxDimension <= 1000) return 'large';
  return 'xlarge';
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
 * In production, only HTTPS URLs are allowed
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  if (url.startsWith('https://') || url.startsWith('/uploads/')) {
    return true;
  }
  
  // In production, reject HTTP URLs
  if (isProduction && url.startsWith('http://')) {
    return false;
  }
  
  // In development, allow HTTP for local testing
  return url.startsWith('http://');
};

