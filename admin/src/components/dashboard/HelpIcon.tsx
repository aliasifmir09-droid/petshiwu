import { HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HelpIconProps {
  content: string;
  link?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const HelpIcon = ({ content, link, position = 'top' }: HelpIconProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Handle keyboard navigation and focus management
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTooltip(false);
        buttonRef.current?.focus();
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showTooltip]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        className="text-gray-400 hover:text-blue-600 cursor-help transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
        aria-label="Show help information"
        aria-expanded={showTooltip}
        aria-haspopup="true"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={(e) => {
          // Don't close if focus moves to tooltip
          if (!tooltipRef.current?.contains(e.relatedTarget as Node)) {
            setShowTooltip(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowTooltip(!showTooltip);
          }
        }}
      >
        <HelpCircle size={16} />
      </button>
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`absolute ${positionClasses[position]} w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50`}
          role="tooltip"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <p className="mb-2">{content}</p>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-100 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Learn more →
            </a>
          )}
          <div className={`absolute ${arrowClasses[position]}`}>
            <div
              className={`border-4 border-transparent ${
                position === 'top'
                  ? 'border-t-gray-900'
                  : position === 'bottom'
                  ? 'border-b-gray-900'
                  : position === 'left'
                  ? 'border-l-gray-900'
                  : 'border-r-gray-900'
              }`}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpIcon;

