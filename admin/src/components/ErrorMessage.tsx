import { AlertTriangle, X } from 'lucide-react';
import { ReactNode } from 'react';

interface ErrorMessageProps {
  title: string;
  message?: string;
  variant?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  children?: ReactNode;
}

/**
 * Standardized error message component for consistent error display across the application
 */
const ErrorMessage = ({ 
  title, 
  message, 
  variant = 'error',
  onDismiss,
  children 
}: ErrorMessageProps) => {
  const variantStyles = {
    error: {
      container: 'bg-red-50 border-red-500',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-600',
      iconBg: 'bg-red-100',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-500',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
    },
    info: {
      container: 'bg-blue-50 border-blue-500',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-600',
      iconBg: 'bg-blue-100',
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
              <h3 className={`${styles.title} font-semibold mb-1`}>
                {title}
              </h3>
              {message && (
                <p className={`${styles.message} text-sm`}>
                  {message}
                </p>
              )}
              {children}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
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

