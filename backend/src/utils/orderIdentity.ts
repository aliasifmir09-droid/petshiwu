import Order from '../models/Order';

/**
 * Resolve Mongo ObjectIds and Petshiwu order numbers (ORD-...) from API params
 * and serialized BSON values the admin UI may send.
 */

const OBJECT_ID_HEX = /^[a-fA-F0-9]{24}$/;
const ORDER_NUMBER = /^ORD-\d+-\d+$/i;

export const isStrictObjectId = (value: string): boolean => OBJECT_ID_HEX.test(value.trim());

export const isOrderNumber = (value: string): boolean => ORDER_NUMBER.test(value.trim());

export const isOrderIdentifier = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return isStrictObjectId(trimmed) || isOrderNumber(trimmed);
};

const bytesToHex = (bytes: number[]): string =>
  bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * Turn ObjectId, {$oid}, Buffer, or "[object Object]" shapes into a 24-char hex id.
 */
export const extractHexId = (value: unknown): string => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]' || trimmed === 'undefined' || trimmed === 'null') {
      return '';
    }
    if (OBJECT_ID_HEX.test(trimmed)) return trimmed;
    return trimmed;
  }

  if (typeof value !== 'object') {
    const asString = String(value);
    return OBJECT_ID_HEX.test(asString) ? asString : '';
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.$oid === 'string' && OBJECT_ID_HEX.test(obj.$oid)) {
    return obj.$oid;
  }

  if (typeof (obj as { toHexString?: () => string }).toHexString === 'function') {
    try {
      const hex = (obj as { toHexString: () => string }).toHexString();
      if (OBJECT_ID_HEX.test(hex)) return hex;
    } catch {
      // ignore
    }
  }

  if (typeof (obj as { toString?: () => string }).toString === 'function') {
    try {
      const asString = (obj as { toString: () => string }).toString();
      if (asString && asString !== '[object Object]' && OBJECT_ID_HEX.test(asString)) {
        return asString;
      }
    } catch {
      // ignore
    }
  }

  const buffer = (obj.buffer || obj) as Record<string, unknown> | number[] | { data?: number[] };
  try {
    let bytes: number[] = [];
    if (Array.isArray(buffer)) {
      bytes = buffer.filter((byte): byte is number => typeof byte === 'number');
    } else if (buffer && typeof buffer === 'object') {
      if (Array.isArray((buffer as { data?: unknown }).data)) {
        bytes = ((buffer as { data: unknown[] }).data).filter((byte): byte is number => typeof byte === 'number');
      } else {
        bytes = Object.values(buffer).filter((byte): byte is number => typeof byte === 'number');
      }
    }
    if (bytes.length >= 12) {
      const hex = bytesToHex(bytes.slice(0, 12));
      if (OBJECT_ID_HEX.test(hex)) return hex;
    }
  } catch {
    // ignore
  }

  return '';
};

export const extractOrderIdentifier = (value: unknown, orderNumber?: unknown): string => {
  const hex = extractHexId(value);
  if (isStrictObjectId(hex) || isOrderNumber(hex)) return hex;
  if (typeof orderNumber === 'string' && isOrderNumber(orderNumber)) {
    return orderNumber.trim().toUpperCase();
  }
  return hex;
};

export const findOrderByIdentifier = async (rawId: unknown) => {
  const extracted = extractHexId(rawId) || (typeof rawId === 'string' ? rawId.trim() : '');
  if (!extracted || extracted === '[object Object]') return null;
  if (isStrictObjectId(extracted)) {
    return Order.findById(extracted);
  }
  if (isOrderNumber(extracted)) {
    return Order.findOne({ orderNumber: extracted.toUpperCase() });
  }
  return null;
};
