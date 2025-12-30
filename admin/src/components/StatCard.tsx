import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red';
  tooltip?: string;
}

const StatCard = ({ title, value, icon: Icon, trend, color = 'blue', tooltip }: StatCardProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const previousValueRef = useRef<string | number>(value);
  
  // Extract numeric value for counting animation
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
    : value;
  
  const animatedValue = useCountUp(numericValue, { duration: 1000 });
  
  // Format the animated value to match original format
  const displayValue = typeof value === 'string' && value.includes('$')
    ? `$${animatedValue}`
    : typeof value === 'string' && value.includes('%')
    ? `${animatedValue}%`
    : animatedValue;
  
  // Highlight when value changes
  useEffect(() => {
    if (previousValueRef.current !== value && previousValueRef.current !== 0) {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 1000);
      return () => clearTimeout(timer);
    }
    previousValueRef.current = value;
  }, [value]);
  
  const gradientClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    yellow: 'from-yellow-500 to-orange-500',
    red: 'from-red-500 to-pink-600'
  };

  const iconBgClasses = {
    blue: 'bg-gradient-to-br from-blue-100 to-indigo-100',
    green: 'bg-gradient-to-br from-green-100 to-emerald-100',
    yellow: 'bg-gradient-to-br from-yellow-100 to-orange-100',
    red: 'bg-gradient-to-br from-red-100 to-pink-100'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 hover-lift animate-fade-in-up group relative overflow-visible">
      {/* Decorative gradient background */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClasses[color]}`}></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
            {tooltip && (
              <div 
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 cursor-help" />
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                    {tooltip}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <h3 
            className={`text-4xl font-black mb-3 transition-all duration-500 ${
              isHighlighted 
                ? 'text-blue-600 scale-110' 
                : 'text-gray-900 scale-100'
            }`}
          >
            {displayValue}
          </h3>
          {trend && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
              trend.isPositive 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {trend.isPositive ? (
                <TrendingUp size={16} className="animate-pulse-slow" />
              ) : (
                <TrendingDown size={16} className="animate-pulse-slow" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`p-5 rounded-2xl ${iconBgClasses[color]} group-hover:scale-110 transition-transform duration-300 shadow-md`}>
          <Icon size={32} className={`bg-gradient-to-br ${gradientClasses[color]} bg-clip-text text-transparent`} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;



