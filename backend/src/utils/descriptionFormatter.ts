/**
 * Formats product descriptions by detecting and formatting headings
 * Headings are identified as text ending with ":" followed by content
 * 
 * @param description - Raw description text from CSV or user input
 * @returns Formatted description with markdown-style **bold** tags for headings
 */
export const formatProductDescription = (description: string): string => {
  if (!description || typeof description !== 'string') {
    return '';
  }

  // Common heading patterns that should be bolded (case-insensitive)
  const knownHeadings = [
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

  let formatted = description.trim();

  // Normalize line breaks
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Normalize whitespace - replace multiple spaces with single space (but preserve intentional line breaks)
  formatted = formatted.replace(/[ \t]+/g, ' ');
  
  // Replace multiple consecutive newlines with double newline (paragraph break)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Process each line to detect and format headings
  const lines = formatted.split('\n');
  const processedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Empty line - add as-is (will create paragraph break)
      processedLines.push('');
      continue;
    }
    
    // Check if line contains a heading pattern
    // Pattern 1: Line starts with known heading followed by colon
    let isHeading = false;
    let headingText = '';
    
    // Check against known headings
    for (const knownHeading of knownHeadings) {
      const regex = new RegExp(`^(${knownHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}):\\s*(.*)$`, 'i');
      const match = line.match(regex);
      if (match) {
        isHeading = true;
        headingText = match[1]; // Use original casing from line
        const content = match[2].trim();
        // Format as: **Heading:** content
        processedLines.push(`**${headingText}:** ${content}`);
        break;
      }
    }
    
    if (isHeading) {
      continue;
    }
    
    // Pattern 2: Line matches "Word: content" pattern (potential heading)
    // Check if line looks like "Heading: Content" format
    const headingPattern = /^([A-Z][^:]{0,49}?):\s*(.+)$/;
    const headingMatch = line.match(headingPattern);
    
    if (headingMatch) {
      const [, potentialHeading, content] = headingMatch;
      // Heuristic: if heading is short (< 40 chars), capitalized, and content is substantial, treat as heading
      if (potentialHeading.length < 40 && potentialHeading.length > 0 && content.trim().length > 0) {
        processedLines.push(`**${potentialHeading.trim()}:** ${content.trim()}`);
        continue;
      }
    }
    
    // Regular line - keep as-is
    processedLines.push(line);
  }
  
  // Join lines back together
  formatted = processedLines.join('\n');
  
  // Clean up: remove extra blank lines but preserve paragraph breaks
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return formatted.trim();
};

/**
 * Converts formatted description (with markdown-style **bold**) to HTML
 * 
 * @param formattedDescription - Description with markdown-style formatting
 * @returns HTML-formatted description
 */
export const descriptionToHTML = (formattedDescription: string): string => {
  if (!formattedDescription) return '';
  
  let html = formattedDescription
    // Convert markdown bold to HTML bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert line breaks to <br> tags
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  // Wrap in paragraph tags if not already wrapped
  if (!html.startsWith('<p>')) {
    html = '<p>' + html + '</p>';
  }
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '').replace(/<p>\s*<\/p>/g, '');
  
  return html;
};

