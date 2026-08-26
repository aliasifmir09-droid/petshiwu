const OBJECT_ID_HEX = /^[a-fA-F0-9]{24}$/;
const ORDER_NUMBER = /^ORD-\d+-\d+$/i;

const bytesToHex = (bytes: number[]): string =>
  bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * Admin lists sometimes serialize Mongo ObjectIds as buffers or `{ $oid }`.
 * Prefer a 24-char hex id, then fall back to ORD-… so status updates still work.
 */
export const extractMongoId = (value: unknown): string => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]' || trimmed === 'undefined' || trimmed === 'null') {
      return '';
    }
    return trimmed;
  }

  if (typeof value !== 'object') {
    const asString = String(value);
    return asString === '[object Object]' ? '' : asString;
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

  if (typeof obj.toString === 'function') {
    try {
      const asString = obj.toString();
      if (asString && asString !== '[object Object]' && OBJECT_ID_HEX.test(asString)) {
        return asString;
      }
    } catch {
      // ignore
    }
  }

  const buffer = (obj.buffer || obj) as { data?: unknown } | unknown[] | Record<string, unknown>;
  try {
    let bytes: number[] = [];
    if (Array.isArray(buffer)) {
      bytes = buffer.filter((byte): byte is number => typeof byte === 'number');
    } else if (buffer && typeof buffer === 'object') {
      if (Array.isArray((buffer as { data?: unknown }).data)) {
        bytes = ((buffer as { data: unknown[] }).data).filter((byte): byte is number => typeof byte === 'number');
      } else {
        bytes = Object.values(buffer as Record<string, unknown>).filter(
          (byte): byte is number => typeof byte === 'number'
        );
      }
    }
    if (bytes.length >= 12) {
      const hex = bytesToHex(bytes.slice(0, 12));
      if (OBJECT_ID_HEX.test(hex)) return hex;
    }
  } catch {
    // ignore
  }

  if (obj._id) return extractMongoId(obj._id);
  if (obj.id) return extractMongoId(obj.id);
  return '';
};

export const resolveOrderApiId = (order: { _id?: unknown; id?: unknown; orderNumber?: unknown } | null | undefined): string => {
  if (!order) return '';
  const hex = extractMongoId(order._id) || extractMongoId(order.id);
  if (hex) return hex;
  const orderNumber = typeof order.orderNumber === 'string' ? order.orderNumber.trim() : '';
  if (ORDER_NUMBER.test(orderNumber)) return orderNumber.toUpperCase();
  return '';
};
