/**
 * Loading Skeleton Component
 * Provides skeleton loading states for better UX
 */

interface LoadingSkeletonProps {
  type?: 'text' | 'image' | 'card' | 'list' | 'table';
  lines?: number;
  className?: string;
}

const LoadingSkeleton = ({ type = 'text', lines = 1, className = '' }: LoadingSkeletonProps) => {
  if (type === 'image') {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        role="status"
        aria-label="Loading image"
      >
        <span className="sr-only">Loading image...</span>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div
        className={`animate-pulse bg-white rounded-lg shadow-lg p-6 ${className}`}
        role="status"
        aria-label="Loading card"
      >
        <div className="h-48 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <span className="sr-only">Loading card...</span>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div role="status" aria-label="Loading list" className={className}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
        <span className="sr-only">Loading list...</span>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div role="status" aria-label="Loading table" className={className}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
        <span className="sr-only">Loading table...</span>
      </div>
    );
  }

  // Default: text
  return (
    <div role="status" aria-label="Loading text" className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 rounded mb-2 ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
          style={{ height: '1rem' }}
        ></div>
      ))}
      <span className="sr-only">Loading text...</span>
    </div>
  );
};

export default LoadingSkeleton;

