import { useState, useCallback } from 'react';

/**
 * Hook to track which product images have failed to load
 * Products with failed images can be hidden from display
 */
const failedImages = new Set<string>();

export const useImageLoadTracker = () => {
  const [, forceUpdate] = useState({});

  const markImageFailed = useCallback((productId: string) => {
    failedImages.add(productId);
    forceUpdate({}); // Trigger re-render
  }, []);

  const isImageFailed = useCallback((productId: string): boolean => {
    return failedImages.has(productId);
  }, []);

  const clearFailedImage = useCallback((productId: string) => {
    failedImages.delete(productId);
    forceUpdate({}); // Trigger re-render
  }, []);

  return {
    markImageFailed,
    isImageFailed,
    clearFailedImage
  };
};

/**
 * Global function to check if a product's image has failed
 * Can be used outside of React components
 */
export const hasImageFailed = (productId: string): boolean => {
  return failedImages.has(productId);
};

