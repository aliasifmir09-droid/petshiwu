import React from 'react';

/**
 * Renders formatted product description with bold headings
 * Handles markdown-style **bold** formatting and line breaks
 * 
 * @param description - Formatted description text (may contain **bold** markers)
 */
export const renderFormattedDescription = (description: string): JSX.Element => {
  if (!description || typeof description !== 'string') {
    return <p className="text-gray-700">No description available.</p>;
  }

  // Split by double newlines (paragraphs)
  const paragraphs = description.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) {
    return <p className="text-gray-700">{description}</p>;
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => {
        // Check if paragraph starts with a heading (markdown-style **Heading:**)
        const headingMatch = paragraph.match(/^\*\*([^*]+):\*\*\s*(.+)$/);
        
        if (headingMatch) {
          const [, heading, content] = headingMatch;
          return (
            <div key={index} className="mb-6">
              <p className="text-gray-700">
                <strong className="font-semibold text-gray-900">{heading}:</strong>{' '}
                {renderInlineContent(content)}
              </p>
            </div>
          );
        }
        
        // Check if paragraph is just a heading without content
        const headingOnlyMatch = paragraph.match(/^\*\*([^*]+):\*\*$/);
        if (headingOnlyMatch) {
          const [, heading] = headingOnlyMatch;
          return (
            <div key={index} className="mb-6">
              <p className="text-gray-700">
                <strong className="font-semibold text-gray-900">{heading}:</strong>
              </p>
            </div>
          );
        }
        
        // Check for markdown-style bold (**text**)
        if (paragraph.includes('**')) {
          return (
            <div key={index} className="mb-6">
              <p className="text-gray-700">
                {renderInlineContent(paragraph)}
              </p>
            </div>
          );
        }
        
        // Regular paragraph
        return (
          <p key={index} className="text-gray-700 mb-4">
            {paragraph.split('\n').map((line, lineIndex, lines) => (
              <React.Fragment key={lineIndex}>
                {renderInlineContent(line)}
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Renders inline content with markdown-style formatting
 */
const renderInlineContent = (content: string): React.ReactNode => {
  // Split by ** for bold markers
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text
      const text = part.slice(2, -2);
      return <strong key={index} className="font-semibold text-gray-900">{text}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

/**
 * Simple component to render formatted description
 */
export const FormattedDescription: React.FC<{ description: string }> = ({ description }) => {
  return renderFormattedDescription(description);
};

