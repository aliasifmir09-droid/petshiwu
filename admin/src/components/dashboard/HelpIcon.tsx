import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface HelpIconProps {
  content: string;
  link?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const HelpIcon = ({ content, link, position = 'top' }: HelpIconProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1 border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1 border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1 border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1 border-r-gray-900',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <HelpCircle 
        size={16} 
        className="text-gray-400 hover:text-blue-600 cursor-help transition-colors" 
      />
      {showTooltip && (
        <div className={`absolute ${positionClasses[position]} w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50`}>
          <p className="mb-2">{content}</p>
          {link && (
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-100 underline"
            >
              Learn more →
            </a>
          )}
          <div className={`absolute ${arrowClasses[position]}`}>
            <div className={`border-4 border-transparent ${
              position === 'top' ? 'border-t-gray-900' :
              position === 'bottom' ? 'border-b-gray-900' :
              position === 'left' ? 'border-l-gray-900' :
              'border-r-gray-900'
            }`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpIcon;

