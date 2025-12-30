import { useEffect, useState } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

export const usePerformanceMetrics = (enabled: boolean = import.meta.env.DEV) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.performance) {
      return;
    }

    // Track page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (loadTime > 0) {
      setMetrics(prev => [...prev, {
        name: 'Page Load',
        duration: loadTime,
        timestamp: Date.now()
      }]);
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask' && entry.duration > 50) {
              setMetrics(prev => [...prev, {
                name: `Long Task: ${entry.name || 'Unknown'}`,
                duration: entry.duration,
                timestamp: entry.startTime
              }]);
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });

        return () => observer.disconnect();
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }, [enabled]);

  const addMetric = (name: string, duration: number) => {
    if (enabled) {
      setMetrics(prev => [...prev, { name, duration, timestamp: Date.now() }]);
    }
  };

  const clearMetrics = () => {
    setMetrics([]);
  };

  return { metrics, addMetric, clearMetrics };
};

