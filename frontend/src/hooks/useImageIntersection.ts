import { useEffect, useRef, useState } from 'react';

/**
 * Hook for intersection observer-based image lazy loading
 * More efficient than native lazy loading, provides better control
 */
export const useImageIntersection = (options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // If image is already loaded, skip intersection observer
    if (img.complete) {
      setIsIntersecting(true);
      setHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            // Start loading the image
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            // Once image loads, mark as loaded
            img.onload = () => {
              setHasLoaded(true);
            };
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
        ...options,
      }
    );

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { imgRef, isIntersecting, hasLoaded };
};

