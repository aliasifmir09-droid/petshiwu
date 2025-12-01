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
    'Key Benefits',
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
  let previousWasHeading = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      // Empty line - add as-is (will create paragraph break)
      processedLines.push('');
      previousWasHeading = false;
      continue;
    }
    
    // Replace "Features & Benefits" or "Features and Benefits" with "Key Benefits" in the line
    // Handle both plain text and markdown formats
    // Also ensure "Key Benefits" is normalized (in case it appears with different casing)
    line = line.replace(/^(Features?\s*(?:&|and)\s*Benefits?):/i, 'Key Benefits:');
    line = line.replace(/^\*\*(Features?\s*(?:&|and)\s*Benefits?):/i, '**Key Benefits:');
    
    // Pattern 1: Line starts with known heading followed by colon
    let isHeading = false;
    let headingText = '';
    let headingContent = '';
    
    // Check against known headings
    for (const knownHeading of knownHeadings) {
      const regex = new RegExp(`^(${knownHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}):\\s*(.*)$`, 'i');
      const match = line.match(regex);
      if (match) {
        isHeading = true;
        // Normalize heading: if it's "Features & Benefits" or "Key Benefits", use "Key Benefits"
        let matchedHeading = match[1].trim();
        if (/^(Features?\s*(?:&|and)\s*Benefits?|Key\s*Benefits?)$/i.test(matchedHeading)) {
          matchedHeading = 'Key Benefits';
        }
        headingText = matchedHeading;
        headingContent = match[2].trim();
        break;
      }
    }
    
    // Also check for markdown-formatted headings
    if (!isHeading) {
      const markdownMatch = line.match(/^\*\*([^*]+):\*\*\s*(.*)$/);
      if (markdownMatch) {
        isHeading = true;
        // Normalize heading: if it's "Features & Benefits" or "Key Benefits", use "Key Benefits"
        let markdownHeading = markdownMatch[1].trim();
        if (/^(Features?\s*(?:&|and)\s*Benefits?|Key\s*Benefits?)$/i.test(markdownHeading)) {
          markdownHeading = 'Key Benefits';
        }
        headingText = markdownHeading;
        headingContent = markdownMatch[2].trim();
      }
    }
    
    // Pattern 2: Line matches "Word: content" pattern (potential heading)
    if (!isHeading) {
      const headingPattern = /^([A-Z][^:]{0,49}?):\s*(.+)$/;
      const headingMatch = line.match(headingPattern);
      
      if (headingMatch) {
        const [, potentialHeading, content] = headingMatch;
        // Heuristic: if heading is short (< 40 chars), capitalized, and content is substantial, treat as heading
        if (potentialHeading.length < 40 && potentialHeading.length > 0 && content.trim().length > 0) {
          isHeading = true;
          // Normalize heading: if it's "Features & Benefits" or "Key Benefits", use "Key Benefits"
          let normalizedHeading = potentialHeading.trim();
          if (/^(Features?\s*(?:&|and)\s*Benefits?|Key\s*Benefits?)$/i.test(normalizedHeading)) {
            normalizedHeading = 'Key Benefits';
          }
          headingText = normalizedHeading;
          headingContent = content.trim();
        }
      }
    }
    
    if (isHeading) {
      // Add blank line before heading if:
      // 1. Previous line was a heading (need spacing between headings)
      // 2. Previous line was not blank (need spacing from regular text)
      const lastLine = processedLines.length > 0 ? processedLines[processedLines.length - 1] : '';
      if (lastLine && lastLine.trim() !== '' && !lastLine.startsWith('**')) {
        // Previous line was regular text - add blank line before heading
        processedLines.push('');
      } else if (previousWasHeading && lastLine && lastLine.trim() !== '') {
        // Previous line was a heading - add blank line between headings
        processedLines.push('');
      }
      
      // Format as: **Heading:** content
      processedLines.push(`**${headingText}:** ${headingContent}`);
      previousWasHeading = true;
      continue;
    }
    
    // Regular line - keep as-is
    processedLines.push(line);
    previousWasHeading = false;
  }
  
  // Join lines back together
  formatted = processedLines.join('\n');
  
  // Ensure double newline (2 blank lines) between heading sections
  // Replace single newlines between headings with double newlines
  formatted = formatted.replace(/(\*\*[^*]+\*\*: [^\n]+)\n(\*\*[^*]+\*\*:)/g, '$1\n\n$2');
  
  // Clean up: ensure consistent double newlines between sections, but remove more than 2 consecutive newlines
  formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
  
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

