/**
 * Utility functions for highlighting search terms in text
 */

/**
 * Highlight search terms in text
 * @param text The text to highlight
 * @param searchTerms Array of search terms to highlight
 * @param className CSS class to apply to highlighted text (default: 'highlight')
 * @returns Array of text parts with highlighted terms
 */
export const highlightSearchTerms = (
  text: string,
  searchTerms: string[],
  className: string = 'highlight'
): Array<{ text: string; highlight: boolean }> => {
  if (!text || !searchTerms || searchTerms.length === 0) {
    return [{ text, highlight: false }];
  }

  // Create a regex pattern that matches any of the search terms (case-insensitive)
  const pattern = new RegExp(`(${searchTerms.map((term) => escapeRegex(term)).join('|')})`, 'gi');
  
  const parts: Array<{ text: string; highlight: boolean }> = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        highlight: false,
      });
    }

    // Add the highlighted match
    parts.push({
      text: match[0],
      highlight: true,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      highlight: false,
    });
  }

  return parts.length > 0 ? parts : [{ text, highlight: false }];
};

/**
 * Escape special regex characters
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Highlight search terms in text and return JSX
 * @param text The text to highlight
 * @param searchTerms Array of search terms to highlight
 * @param highlightClassName CSS class to apply to highlighted text (default: 'highlight')
 * @returns JSX element with highlighted text
 */
export const HighlightText = ({
  text,
  searchTerms,
  highlightClassName = 'highlight',
}: {
  text: string;
  searchTerms: string[];
  highlightClassName?: string;
}) => {
  const parts = highlightSearchTerms(text, searchTerms, highlightClassName);

  return (
    <>
      {parts.map((part, index) =>
        part.highlight ? (
          <mark key={index} className={highlightClassName}>
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
};

