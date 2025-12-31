import React from 'react';

/**
 * Highlights occurrences of a search term within a given text.
 * @param text The full text to search within.
 * @param searchTerm The term to highlight.
 * @param highlightClassName The CSS class to apply to highlighted parts.
 * @returns A ReactNode array with highlighted spans.
 */
export const highlightSearchTerm = (
  text: string,
  searchTerm: string,
  highlightClassName: string = 'bg-yellow-200 font-semibold'
): React.ReactNode[] => {
  if (!searchTerm || searchTerm.trim() === '') {
    return [text];
  }

  const parts: React.ReactNode[] = [];
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add the text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add the highlighted match using React.createElement
    parts.push(
      React.createElement(
        'span',
        { key: `highlight-${keyIndex++}`, className: highlightClassName },
        match[0]
      )
    );
    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no matches found, return the original text
  return parts.length > 0 ? parts : [text];
};

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
export const HighlightText: React.FC<{
  text: string;
  searchTerms: string[];
  highlightClassName?: string;
}> = ({ text, searchTerms, highlightClassName = 'highlight' }) => {
  const parts = highlightSearchTerms(text, searchTerms, highlightClassName);

  return React.createElement(
    React.Fragment,
    null,
    ...parts.map((part, index) =>
      part.highlight
        ? React.createElement('mark', { key: index, className: highlightClassName }, part.text)
        : React.createElement('span', { key: index }, part.text)
    )
  );
};
