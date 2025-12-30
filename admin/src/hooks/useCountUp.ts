import { useEffect, useState, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  startOnMount?: boolean;
}

export const useCountUp = (
  end: number | string,
  options: UseCountUpOptions = {}
): string => {
  const { duration = 1000, startOnMount = true } = options;
  const [count, setCount] = useState(startOnMount ? 0 : typeof end === 'number' ? end : 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousEndRef = useRef<number | string>(end);

  useEffect(() => {
    // If end is not a number, return it as-is
    if (typeof end !== 'number') {
      setCount(0);
      return;
    }

    // If end value changed, restart animation
    if (previousEndRef.current !== end) {
      previousEndRef.current = end;
      setIsAnimating(true);
      startTimeRef.current = null;
    }

    if (!isAnimating && startOnMount) {
      setIsAnimating(true);
      startTimeRef.current = null;
    }

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsAnimating(false);
      }
    };

    if (isAnimating) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [end, duration, isAnimating, startOnMount]);

  // Format number with commas
  if (typeof end !== 'number') {
    return end;
  }

  return count.toLocaleString();
};

