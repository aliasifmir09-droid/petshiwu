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

