import { AlertCircle, TrendingUp, TrendingDown, CheckCircle, Info } from 'lucide-react';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
  icon?: React.ReactNode;
}

interface InsightsCardProps {
  insights: Insight[];
}

const InsightsCard = ({ insights }: InsightsCardProps) => {
  if (!insights || insights.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          text: 'text-green-800',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800',
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800',
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-800',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100" role="region" aria-label="Analytics insights">
      <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Insights & Recommendations</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => {
          const styles = getStyles(insight.type);
          return (
            <div
              key={index}
              className={`${styles.container} border-l-4 rounded-lg p-4 flex items-start gap-3`}
            >
              <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
                {insight.icon || getIcon(insight.type)}
              </div>
              <p className={`${styles.text} text-sm font-medium flex-1`}>
                {insight.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightsCard;

