/**
 * Utility function to normalize MongoDB ObjectId to string
 * Handles various formats: string, ObjectId object, nested objects
 * 
 * @param id - The ID to normalize (can be string, ObjectId, or object)
 * @returns Normalized string ID or null if invalid
 */
export const normalizeId = (id: unknown): string | null => {
  if (!id) return null;
  
  // Already a string
  if (typeof id === 'string') {
    // Validate it's a MongoDB ObjectId format (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      return id;
    }
    // Return anyway, backend will validate
    return id;
  }
  
  // Object with potential ID properties
  if (id && typeof id === 'object') {
    // Try toString() method first
    if (typeof (id as { toString?: () => string }).toString === 'function') {
      const str = (id as { toString: () => string }).toString();
      if (str && str !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(str)) {
        return str;
      }
    }
    
    // Try common ObjectId properties
    const possibleProps = ['id', '_id', '_str', '$oid', 'oid', 'value', 'hex'];
    for (const prop of possibleProps) {
      const value = (id as Record<string, unknown>)[prop];
      if (value && typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
        return value;
      }
    }
    
    // Try valueOf()
    if (typeof (id as { valueOf?: () => unknown }).valueOf === 'function') {
      const value = (id as { valueOf: () => unknown }).valueOf();
      if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
        return value;
      }
    }
    
    // Try JSON.stringify/parse for nested objects
    try {
      const jsonStr = JSON.stringify(id);
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
      if (parsed.$oid && typeof parsed.$oid === 'string' && /^[0-9a-fA-F]{24}$/.test(parsed.$oid)) {
        return parsed.$oid;
      }
      if (parsed.oid && typeof parsed.oid === 'string' && /^[0-9a-fA-F]{24}$/.test(parsed.oid)) {
        return parsed.oid;
      }
      if (typeof parsed === 'string' && /^[0-9a-fA-F]{24}$/.test(parsed)) {
        return parsed;
      }
    } catch (e) {
      // JSON operations failed, continue
    }
    
    // Check all string properties
    for (const key in id) {
      if (Object.prototype.hasOwnProperty.call(id, key)) {
        const value = (id as Record<string, unknown>)[key];
        if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
          return value;
        }
      }
    }
  }
  
  return null;
};

/**
 * Normalizes an array of IDs
 */
export const normalizeIds = (ids: unknown[]): (string | null)[] => {
  return ids.map(normalizeId);
};

