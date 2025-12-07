import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'error' | 'warning' | 'info';
}

const ErrorMessage = ({
  title = 'Something went wrong',
  message,
  details,
  onRetry,
  onDismiss,
  className = '',
  variant = 'error'
}: ErrorMessageProps) => {
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconColors = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  return (
    <div
      className={`rounded-lg border p-4 ${variantStyles[variant]} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`${iconColors[variant]} flex-shrink-0 mt-0.5`} size={20} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm">{message}</p>
          {details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium hover:underline">
                Show details
              </summary>
              <p className="mt-2 text-sm opacity-90">{details}</p>
            </details>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
              aria-label="Retry operation"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
            aria-label="Dismiss error message"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

