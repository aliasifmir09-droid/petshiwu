/**
 * Reusable Skeleton component for consistent loading states
 * Provides standardized loading animations across the application
 */

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table-row' | 'chart';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  count = 1,
  animation = 'pulse',
}: SkeletonProps) => {
  const baseClasses = 'bg-gray-200 rounded';
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Can be enhanced with custom wave animation
    none: '',
  };

  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
    card: 'rounded-xl',
    'table-row': 'rounded',
    chart: 'rounded',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const skeletonElement = (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
      role="status"
      aria-label="Loading"
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{skeletonElement}</div>
      ))}
    </>
  );
};

// Pre-configured skeleton components for common use cases
export const SkeletonCard = ({ count = 1 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <Skeleton variant="text" width="40%" className="mb-4" />
        <Skeleton variant="text" width="60%" height={32} className="mb-3" />
        <Skeleton variant="text" width="80%" />
      </div>
    ))}
  </div>
);

export const SkeletonTableRow = ({ count = 5 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-4">
          <Skeleton variant="text" width={96} />
        </td>
        <td className="px-6 py-4">
          <Skeleton variant="text" width={128} />
        </td>
        <td className="px-6 py-4">
          <Skeleton variant="text" width={64} />
        </td>
        <td className="px-6 py-4">
          <Skeleton variant="text" width={80} height={24} />
        </td>
        <td className="px-6 py-4">
          <Skeleton variant="text" width={80} />
        </td>
      </tr>
    ))}
  </>
);

export const SkeletonChart = () => (
  <div className="h-[300px] animate-pulse">
    <Skeleton variant="text" width={128} className="mb-4" />
    <Skeleton variant="chart" width="100%" height="100%" />
  </div>
);

export default Skeleton;

