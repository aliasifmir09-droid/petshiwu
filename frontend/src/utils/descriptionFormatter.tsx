import React from 'react';
import DOMPurify from 'dompurify';

/**
 * Common heading patterns that should be bolded
 */
const HEADING_PATTERNS = [
  'Key Benefits',
  'Features & Benefits',
  'Features and Benefits',
  'Features',
  'Intended For',
  'Includes',
  'Uses',
  'Use',
  'Cautions',
  'Total Weight',
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
  let trimmed = line.trim();
  
  // Replace "Features & Benefits" or "Features and Benefits" with "Key Benefits"
  // Handle both plain text and markdown formats
  trimmed = trimmed.replace(/^(Features?\s*(?:&|and)\s*Benefits?):/i, 'Key Benefits:');
  trimmed = trimmed.replace(/^\*\*(Features?\s*(?:&|and)\s*Benefits?):/i, '**Key Benefits:');
  
  // Helper function to normalize heading text
  const normalizeHeading = (heading: string): string => {
    if (/^(Features?\s*(?:&|and)\s*Benefits?|Key\s*Benefits?)$/i.test(heading.trim())) {
      return 'Key Benefits';
    }
    return heading.trim();
  };
  
  // Check for markdown-style bold (**Heading:**)
  const markdownMatch = trimmed.match(/^\*\*([^*]+):\*\*\s*(.*)$/);
  if (markdownMatch) {
    return { 
      isHeading: true, 
      headingText: normalizeHeading(markdownMatch[1]), 
      content: markdownMatch[2].trim() 
    };
  }
  
  // Check for known heading patterns
  for (const pattern of HEADING_PATTERNS) {
    const regex = new RegExp(`^(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}):\\s*(.*)$`, 'i');
    const match = trimmed.match(regex);
    if (match) {
      return { 
        isHeading: true, 
        headingText: normalizeHeading(match[1]), 
        content: match[2].trim() 
      };
    }
  }
  
  // Check for generic "Word: content" pattern
  const genericMatch = trimmed.match(/^([A-Z][^:]{0,40}?):\s*(.+)$/);
  if (genericMatch) {
    const heading = genericMatch[1].trim();
    if (heading.length > 0 && heading.length < 40) {
      return { 
        isHeading: true, 
        headingText: normalizeHeading(heading), 
        content: genericMatch[2].trim() 
      };
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

  // Sanitize HTML to prevent XSS attacks
  // Remove all HTML tags and attributes, keeping only text content
  const sanitized = DOMPurify.sanitize(description, { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []  // No attributes allowed
  });

  // Normalize line breaks
  let normalized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Process lines to detect headings and create sections
  const sections: Array<{ type: 'heading' | 'paragraph'; heading?: string; content: string }> = [];
  const lines = normalized.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip empty lines but count consecutive empties
    if (!line) {
      i++;
      continue;
    }
    
    // Check if this line is a heading
    const headingCheck = isHeading(line);
    
    if (headingCheck.isHeading) {
      // Found a heading - save it as a section
      sections.push({
        type: 'heading',
        heading: headingCheck.headingText,
        content: headingCheck.content || ''
      });
      i++;
    } else {
      // Regular paragraph - collect all lines until we hit a heading or double blank
      let paragraphContent = line;
      i++;
      
      // Collect subsequent lines until we hit a heading or double blank
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        
        // If blank line, check if next is also blank or if it's a heading
        if (!nextLine) {
          const lineAfter = i < lines.length - 1 ? lines[i + 1].trim() : '';
          const isHeadingAfter = lineAfter ? isHeading(lineAfter).isHeading : false;
          
          if (isHeadingAfter) {
            // Next line is a heading - stop here
            break;
          } else if (!lineAfter) {
            // Double blank - stop here
            i++; // Skip this blank
            break;
          } else {
            // Single blank - continue collecting
            paragraphContent += '\n\n';
            i++;
            continue;
          }
        }
        
        // Check if next line is a heading
        const nextIsHeading = isHeading(nextLine);
        if (nextIsHeading.isHeading) {
          break;
        }
        
        // Add to paragraph content
        paragraphContent += '\n' + nextLine;
        i++;
      }
      
      if (paragraphContent.trim()) {
        sections.push({
          type: 'paragraph',
          content: paragraphContent.trim()
        });
      }
    }
  }
  
  // If no sections found, render as plain text
  if (sections.length === 0) {
    return <p className="text-gray-700 whitespace-pre-line">{sanitized}</p>;
  }
  
  return (
    <div>
      {sections.map((section, index) => {
        const isHeading = section.type === 'heading';
        const prevSection = index > 0 ? sections[index - 1] : null;
        const isFirstSection = index === 0;
        
        // Add top margin if this is a heading and previous section was not a heading
        const topMargin = isHeading && prevSection && prevSection.type !== 'heading' && !isFirstSection ? 'mt-6' : '';
        const bottomMargin = isHeading ? 'mb-6' : 'mb-4';
        
        if (isHeading) {
          return (
            <div key={index} className={`${topMargin} ${bottomMargin}`}>
              <p className="text-gray-700 leading-relaxed">
                <strong className="font-bold text-gray-900 text-base">{section.heading}:</strong>
                {section.content && (
                  <span className="ml-1">{renderInlineContent(section.content)}</span>
                )}
              </p>
            </div>
          );
        }
        
        return (
          <p key={index} className={`text-gray-700 ${bottomMargin} whitespace-pre-line leading-relaxed`}>
            {renderInlineContent(section.content)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Renders inline content with markdown-style formatting
 * Sanitizes content to prevent XSS attacks
 */
const renderInlineContent = (content: string): React.ReactNode => {
  // Sanitize content first to remove any HTML
  const sanitized = DOMPurify.sanitize(content, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
  
  // Split by ** for bold markers
  const parts = sanitized.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text - sanitize the extracted text
      const text = part.slice(2, -2);
      const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      return <strong key={index} className="font-semibold text-gray-900">{sanitizedText}</strong>;
    }
    // Sanitize regular text parts
    const sanitizedPart = DOMPurify.sanitize(part, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    return <React.Fragment key={index}>{sanitizedPart}</React.Fragment>;
  });
};

/**
 * Simple component to render formatted description
 */
export const FormattedDescription: React.FC<{ description: string }> = ({ description }) => {
  return renderFormattedDescription(description);
};

