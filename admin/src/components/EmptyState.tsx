/**
 * Reusable EmptyState component for consistent empty state displays
 * Provides engaging empty states with illustrations and actionable steps
 */

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  illustration?: ReactNode;
  className?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  className = '',
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {illustration ? (
        illustration
      ) : (
        <div className="bg-gray-100 p-6 rounded-full mb-6">
          <Icon className="text-gray-400" size={64} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{title}</h3>
      {description && (
        <p className="text-gray-500 text-sm mb-6 text-center max-w-md">{description}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <a
            href={action.href}
            onClick={(e) => {
              if (!action.href) {
                e.preventDefault();
                action.onClick();
              }
            }}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {action.label}
          </a>
        )}
        {secondaryAction && (
          <a
            href={secondaryAction.href}
            onClick={(e) => {
              if (!secondaryAction.href) {
                e.preventDefault();
                secondaryAction.onClick();
              }
            }}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {secondaryAction.label}
          </a>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

