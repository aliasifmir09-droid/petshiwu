import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    to: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    to: string;
    onClick?: () => void;
  };
  className?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) => {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-12 text-center ${className}`} role="status" aria-live="polite">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
        <Icon className="text-gray-400" size={48} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">{description}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {action && (
          <Link
            to={action.to}
            onClick={action.onClick}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={action.label}
          >
            {action.label}
          </Link>
        )}
        {secondaryAction && (
          <Link
            to={secondaryAction.to}
            onClick={secondaryAction.onClick}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label={secondaryAction.label}
          >
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

