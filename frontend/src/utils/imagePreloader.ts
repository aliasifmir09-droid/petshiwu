/**
 * Preload critical images for better LCP (Largest Contentful Paint)
 */

/**
 * Preload a single image
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Preload multiple images
 */
export const preloadImages = async (srcs: string[]): Promise<void> => {
  await Promise.allSettled(srcs.map(preloadImage));
};

/**
 * Preload critical images for product detail page
 * Call this when user hovers over product card or navigates to product
 */
export const preloadProductImages = async (imageUrls: string[]): Promise<void> => {
  if (!imageUrls || imageUrls.length === 0) return;
  
  // Preload first 3 images (main image + 2 thumbnails)
  const imagesToPreload = imageUrls.slice(0, 3);
  await preloadImages(imagesToPreload);
};

/**
 * Preload hero/slideshow images
 */
export const preloadHeroImages = async (imageUrls: string[]): Promise<void> => {
  if (!imageUrls || imageUrls.length === 0) return;
  
  // Preload first 2 hero images
  const imagesToPreload = imageUrls.slice(0, 2);
  await preloadImages(imagesToPreload);
};

