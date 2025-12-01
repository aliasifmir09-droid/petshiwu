import React from 'react';

/**
 * Common heading patterns that should be bolded
 */
const HEADING_PATTERNS = [
  'Features & Benefits',
  'Features and Benefits',
  'Item Number',
  'Brand',
  'Food Type',
  'Breed Size',
  'Life Stage',
  'Nutritional Benefits',
  'Health Consideration',
  'Health Considerations',
  'Flavor',
  'Weight',
  'Ingredients',
  'Ingredient',
  'Guaranteed Analysis',
  'Caloric Content',
  'Transition Instructions',
  'Transition Instruction',
  'Species',
  'Warranty',
  'Dimensions',
  'Dimension',
  'Color',
  'Size',
  'Material',
  'Care Instructions',
  'Care Instruction'
];

/**
 * Checks if a line is a heading
 */
const isHeading = (line: string): { isHeading: boolean; headingText?: string; content?: string } => {
  const trimmed = line.trim();
  
  // Check for markdown-style bold (**Heading:**)
  const markdownMatch = trimmed.match(/^\*\*([^*]+):\*\*\s*(.*)$/);
  if (markdownMatch) {
    return { isHeading: true, headingText: markdownMatch[1].trim(), content: markdownMatch[2].trim() };
  }
  
  // Check for known heading patterns
  for (const pattern of HEADING_PATTERNS) {
    const regex = new RegExp(`^(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}):\\s*(.*)$`, 'i');
    const match = trimmed.match(regex);
    if (match) {
      return { isHeading: true, headingText: match[1].trim(), content: match[2].trim() };
    }
  }
  
  // Check for generic "Word: content" pattern
  const genericMatch = trimmed.match(/^([A-Z][^:]{0,40}?):\s*(.+)$/);
  if (genericMatch) {
    const heading = genericMatch[1].trim();
    if (heading.length > 0 && heading.length < 40) {
      return { isHeading: true, headingText: heading, content: genericMatch[2].trim() };
    }
  }
  
  return { isHeading: false };
};

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

  // Normalize line breaks
  let normalized = description.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into sections - preserve double newlines
  // Split by double newlines, but also check for headings
  const sections: Array<{ type: 'heading' | 'paragraph'; heading?: string; content: string }> = [];
  const lines = normalized.split('\n');
  
  let currentSection: { type: 'heading' | 'paragraph'; heading?: string; content: string } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isBlank = line.length === 0;
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    const isNextBlank = nextLine.length === 0;
    
    // Check if this is a heading
    const headingCheck = isHeading(line);
    
    if (headingCheck.isHeading) {
      // If we have a current section, save it
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }
      
      // Start new heading section
      currentSection = {
        type: 'heading',
        heading: headingCheck.headingText,
        content: headingCheck.content || ''
      };
      
      // If next line is blank and line after that exists, skip the blank
      if (isNextBlank && i < lines.length - 2) {
        i++; // Skip the blank line
      }
    } else if (!isBlank) {
      // Regular content line
      if (!currentSection) {
        currentSection = { type: 'paragraph', content: '' };
      }
      
      if (currentSection.content) {
        currentSection.content += '\n' + line;
      } else {
        currentSection.content = line;
      }
    } else if (isBlank && currentSection) {
      // Blank line - if we have 2 consecutive blanks, end current section
      const lineAfterNext = i < lines.length - 2 ? lines[i + 2].trim() : '';
      if (isNextBlank && lineAfterNext.length === 0) {
        // Two consecutive blanks - end section
        if (currentSection.content.trim()) {
          sections.push(currentSection);
        }
        currentSection = null;
        i++; // Skip next blank line too
      }
    }
  }
  
  // Push last section
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  // If no sections found, render as plain text
  if (sections.length === 0) {
    return <p className="text-gray-700 whitespace-pre-line">{description}</p>;
  }
  
  return (
    <div>
      {sections.map((section, index) => {
        const isLast = index === sections.length - 1;
        const marginBottom = section.type === 'heading' ? 'mb-6' : 'mb-4';
        
        if (section.type === 'heading') {
          return (
            <div key={index} className={marginBottom}>
              <p className="text-gray-700">
                <strong className="font-bold text-gray-900">{section.heading}:</strong>
                {section.content && ` ${renderInlineContent(section.content)}`}
              </p>
            </div>
          );
        }
        
        return (
          <p key={index} className={`text-gray-700 ${marginBottom} whitespace-pre-line`}>
            {renderInlineContent(section.content)}
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

