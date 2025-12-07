const LoadingSpinner = ({ size = 'md', ariaLabel = 'Loading' }: { size?: 'sm' | 'md' | 'lg'; ariaLabel?: string }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex justify-center items-center" role="status" aria-label={ariaLabel}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export default LoadingSpinner;



