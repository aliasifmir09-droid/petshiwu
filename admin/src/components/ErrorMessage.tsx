import { AlertTriangle, X, RefreshCw, ExternalLink } from 'lucide-react';
import { ReactNode } from 'react';

interface ErrorMessageProps {
  title: string;
  message?: string;
  variant?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  children?: ReactNode;
  errorCode?: string;
  suggestions?: string[];
  learnMoreLink?: string;
  onRetry?: () => void;
}

/**
 * Enhanced error message component with actionable solutions and error codes
 * Provides specific error details and helps users resolve issues
 */
const ErrorMessage = ({
  title,
  message,
  variant = 'error',
  onDismiss,
  children,
  errorCode,
  suggestions,
  learnMoreLink,
  onRetry,
}: ErrorMessageProps) => {
  const variantStyles = {
    error: {
      container: 'bg-red-50 border-red-500',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-600',
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-500',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      container: 'bg-blue-50 border-blue-500',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-600',
      iconBg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`${styles.container} border-l-4 rounded-xl p-4 shadow-lg`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${styles.iconBg} p-2 rounded-full`} aria-hidden="true">
          <AlertTriangle className={styles.icon} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`${styles.title} font-semibold`}>{title}</h3>
                {errorCode && (
                  <span className="text-xs bg-white/50 px-2 py-1 rounded font-mono">
                    {errorCode}
                  </span>
                )}
              </div>
              {message && (
                <p className={`${styles.message} text-sm mb-2`}>{message}</p>
              )}
              {suggestions && suggestions.length > 0 && (
                <div className="mt-3">
                  <p className={`${styles.message} text-xs font-semibold mb-1`}>
                    Try these solutions:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className={`${styles.message} text-xs`}>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(onRetry || learnMoreLink) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className={`${styles.button} px-3 py-1.5 rounded text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent flex items-center gap-1`}
                    >
                      <RefreshCw size={14} />
                      Retry
                    </button>
                  )}
                  {learnMoreLink && (
                    <a
                      href={learnMoreLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.button} px-3 py-1.5 rounded text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent flex items-center gap-1`}
                    >
                      Learn More
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}
              {children}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                aria-label="Dismiss error message"
              >
                <X size={16} className={styles.icon} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;

