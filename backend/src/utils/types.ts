/**
 * Type utilities to replace 'as any' assertions
 */

import mongoose from 'mongoose';

/**
 * Type guard to check if an object has a toString method
 */
export interface HasToString {
  toString(): string;
}

/**
 * Type guard to check if an object has an _id property
 */
export interface HasId {
  _id: unknown;
}

/**
 * Safely convert unknown value to string, handling ObjectId and various formats
 */
export const safeToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object' && value !== null) {
    // Check if it's a Mongoose ObjectId - try converting to string first
    const strValue = String(value);
    if (mongoose.Types.ObjectId.isValid(strValue)) {
      if (value instanceof mongoose.Types.ObjectId) {
        return value.toString();
      }
      // Try to convert if it has toString
      if ('toString' in value && typeof (value as HasToString).toString === 'function') {
        const str = (value as HasToString).toString();
        if (str && str !== '[object Object]') {
          return str;
        }
      }
    }
    
    // Try _id property
    if ('_id' in value) {
      const id = (value as HasId)._id;
      if (id) {
        return safeToString(id);
      }
    }
    
    // Try toString method
    if ('toString' in value && typeof (value as HasToString).toString === 'function') {
      const str = (value as HasToString).toString();
      if (str && str !== '[object Object]') {
        return str;
      }
    }
    
    // Try valueOf
    if ('valueOf' in value && typeof (value as { valueOf: () => unknown }).valueOf === 'function') {
      const val = (value as { valueOf: () => unknown }).valueOf();
      if (typeof val === 'string') {
        return val;
      }
    }
  }
  
  return String(value);
};

/**
 * Safely extract ObjectId from unknown value
 */
export const safeToObjectId = (value: unknown): mongoose.Types.ObjectId | null => {
  if (!value) return null;
  
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }
  
  const str = safeToString(value);
  if (mongoose.Types.ObjectId.isValid(str)) {
    return new mongoose.Types.ObjectId(str);
  }
  
  return null;
};

/**
 * Type guard for objects with _id property
 */
export const hasObjectId = (value: unknown): value is { _id: mongoose.Types.ObjectId | string } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    (value._id instanceof mongoose.Types.ObjectId || typeof value._id === 'string')
  );
};

/**
 * Extract ObjectId from various formats
 */
export const extractObjectId = (value: unknown): mongoose.Types.ObjectId | null => {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }
  
  if (hasObjectId(value)) {
    if (value._id instanceof mongoose.Types.ObjectId) {
      return value._id;
    }
    if (typeof value._id === 'string') {
      return mongoose.Types.ObjectId.isValid(value._id) 
        ? new mongoose.Types.ObjectId(value._id) 
        : null;
    }
  }
  
  return safeToObjectId(value);
};

