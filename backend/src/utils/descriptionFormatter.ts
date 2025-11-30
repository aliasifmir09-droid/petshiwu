/**
 * Formats product descriptions by detecting and formatting headings
 * Headings are identified as text ending with ":" followed by content
 * 
 * @param description - Raw description text from CSV or user input
 * @returns Formatted description with HTML bold tags for headings
 */
export const formatProductDescription = (description: string): string => {
  if (!description || typeof description !== 'string') {
    return '';
  }

  // Common heading patterns that should be bolded
  const headingPatterns = [
    /(Features\s*&\s*Benefits?):/gi,
    /(Item\s*Number):/gi,
    /(Brand):/gi,
    /(Food\s*Type):/gi,
    /(Breed\s*Size):/gi,
    /(Life\s*Stage):/gi,
    /(Nutritional\s*Benefits?):/gi,
    /(Health\s*Consideration):/gi,
    /(Flavor):/gi,
    /(Weight):/gi,
    /(Ingredients?):/gi,
    /(Guaranteed\s*Analysis):/gi,
    /(Caloric\s*Content):/gi,
    /(Transition\s*Instructions?):/gi,
    /(Species):/gi,
    /(Warranty):/gi,
    /(Dimensions?):/gi,
    /(Color):/gi,
    /(Size):/gi,
    /(Material):/gi,
    /(Care\s*Instructions?):/gi
  ];

  let formatted = description.trim();

  // First, normalize line breaks and whitespace
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Replace multiple spaces with single space
  formatted = formatted.replace(/[ \t]+/g, ' ');
  
  // Replace multiple newlines with double newline (paragraph break)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Split by double newlines first to handle paragraph breaks
  const paragraphs = formatted.split(/\n\s*\n/);
  
  const formattedParagraphs = paragraphs.map(paragraph => {
    if (!paragraph.trim()) return '';
    
    // Check for explicit headings (text ending with colon followed by content)
    // Pattern: Heading: content (heading should be on its own line or at start of line)
    const headingRegex = /^([A-Z][^:]*?):\s*(.+)$/gm;
    let processed = paragraph;
    
    // Replace headings with bold format
    processed = processed.replace(headingRegex, (match, heading, content) => {
      // Check if this looks like a heading (capitalized, short, ends with colon)
      if (heading.length > 0 && heading.length < 50 && /^[A-Z]/.test(heading.trim())) {
        return `**${heading.trim()}:** ${content.trim()}`;
      }
      return match;
    });
    
    // Also apply known heading patterns
    headingPatterns.forEach(pattern => {
      processed = processed.replace(pattern, (match, heading) => {
        return `**${heading}:**`;
      });
    });
    
    return processed.trim();
  }).filter(p => p.length > 0);
  
  // Join paragraphs with double newline
  return formattedParagraphs.join('\n\n');
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

