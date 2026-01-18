/**
 * HTML utility functions for decoding HTML entities
 * Prevents issues like "&amp;" being displayed instead of "&"
 */

/**
 * Decodes HTML entities in a string
 * Converts entities like &amp; &lt; &gt; &quot; &#39; etc. to their actual characters
 * @param text The text that may contain HTML entities
 * @returns The decoded text
 */
export const decodeHtmlEntities = (text: string | null | undefined): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Create a temporary textarea element to decode HTML entities
  // This is the safest way to decode HTML entities in the browser
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

/**
 * Decodes HTML entities in an array of strings
 * @param texts Array of strings that may contain HTML entities
 * @returns Array of decoded strings
 */
export const decodeHtmlEntitiesArray = (texts: (string | null | undefined)[]): string[] => {
  return texts.map(text => decodeHtmlEntities(text));
};

/**
 * Decodes HTML entities in an object's string properties
 * Useful for decoding category/product names in objects
 * @param obj Object with string properties
 * @param keys Array of property keys to decode
 * @returns New object with decoded properties
 */
export const decodeHtmlEntitiesInObject = <T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[]
): T => {
  const decoded = { ...obj };
  keys.forEach(key => {
    if (typeof decoded[key] === 'string') {
      (decoded as any)[key] = decodeHtmlEntities(decoded[key]);
    }
  });
  return decoded;
};

/**
 * Normalizes blog content HTML to ensure proper paragraph formatting
 * Converts plain text blocks to paragraph tags and preserves line breaks
 * @param html The HTML content that may contain plain text or improper formatting
 * @returns Normalized HTML with proper paragraph tags
 */
export const normalizeBlogContent = (html: string | null | undefined): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // First decode any HTML entities
  let normalized = decodeHtmlEntities(html);

  // If the content doesn't contain any HTML tags, treat it as plain text
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(normalized);
  
  if (!hasHtmlTags) {
    // It's plain text - convert newlines to <br> and wrap in <p> tags
    // Multiple newlines become paragraph breaks
    normalized = normalized
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines to double newlines
    
    // Split by double newlines (paragraph breaks) or single newlines
    const paragraphs = normalized.split(/\n\n+/);
    
    normalized = paragraphs
      .map(para => {
        const trimmed = para.trim();
        if (!trimmed) return '';
        // Replace single newlines within paragraphs with <br>
        const withBreaks = trimmed.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
      })
      .filter(p => p)
      .join('');
    
    return normalized;
  }

  // Content has HTML tags - ensure text nodes outside tags are wrapped
  // Check if there are any text blocks that aren't wrapped in tags at the top level
  // This handles cases like "text<p>more text</p>" or mixed content
  
  // Normalize line breaks within existing HTML
  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // If content doesn't start with a tag, wrap leading text
  if (!normalized.trim().startsWith('<')) {
    // Extract leading text before first tag
    const leadingTextMatch = normalized.match(/^([^<]+)/);
    if (leadingTextMatch) {
      const leadingText = leadingTextMatch[1].trim();
      if (leadingText) {
        // Convert newlines in leading text to <br>
        const withBreaks = leadingText.replace(/\n/g, '<br>');
        normalized = `<p>${withBreaks}</p>` + normalized.substring(leadingTextMatch[0].length);
      }
    }
  }

  // Wrap any trailing text after last tag
  if (!normalized.trim().endsWith('>')) {
    const trailingTextMatch = normalized.match(/([^>]+)$/);
    if (trailingTextMatch && !trailingTextMatch[1].trim().match(/^<[^>]+$/)) {
      const trailingText = trailingTextMatch[1].trim();
      if (trailingText) {
        const withBreaks = trailingText.replace(/\n/g, '<br>');
        normalized = normalized.substring(0, normalized.length - trailingTextMatch[0].length) + `<p>${withBreaks}</p>`;
      }
    }
  }

  // Ensure divs with text content that should be paragraphs are converted
  // This handles cases where contentEditable creates divs instead of paragraphs
  // Handle both simple divs and divs with nested elements like <br>
  normalized = normalized.replace(/<div([^>]*)>(.*?)<\/div>/gis, (match, attrs, content) => {
    const trimmed = content.trim();
    if (!trimmed) return '';
    
    // Check if div contains only inline formatting (br, strong, em, etc.) or text
    // If it doesn't contain block elements (p, h1-h6, ul, ol, blockquote), convert to p
    const hasBlockElements = /<(p|h[1-6]|ul|ol|blockquote|table|div)[\s>]/i.test(trimmed);
    
    if (!hasBlockElements) {
      // Convert div to paragraph, preserving inner HTML
      return `<p${attrs || ''}>${trimmed}</p>`;
    }
    // If it has block elements, keep as div (or could be unwrapped, but that's complex)
    return match;
  });

  // Convert consecutive line breaks to paragraph breaks in text nodes
  // This is a simple approach - more complex would require a full HTML parser
  normalized = normalized.replace(/([^>])\n\n+([^<])/g, '$1</p><p>$2');
  normalized = normalized.replace(/([^>])\n([^<])/g, '$1<br>$2');

  return normalized;
};

