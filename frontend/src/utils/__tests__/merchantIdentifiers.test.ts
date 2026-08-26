import { describe, expect, test } from 'vitest';
import { merchantMpn, looksLikeGtin, productSchemaIdentifiers } from '../merchantIdentifiers';

describe('merchantMpn', () => {
  test('keeps SKUs within Google\'s 1–70 character limit', () => {
    expect(merchantMpn('MM-30')).toBe('MM-30');
    expect(merchantMpn('x'.repeat(70))).toHaveLength(70);
  });

  test('omits empty and oversized SKUs instead of truncating', () => {
    expect(merchantMpn('')).toBeUndefined();
    expect(merchantMpn('   ')).toBeUndefined();
    expect(merchantMpn('x'.repeat(71))).toBeUndefined();
    expect(
      merchantMpn(
        'petsafe®-cat-flap:-2-way-locking---built-in-lock---durable---easy-install---hardware-kit-i'
      )
    ).toBeUndefined();
  });
});

describe('looksLikeGtin', () => {
  test('accepts 8 and 12-14 digit codes', () => {
    expect(looksLikeGtin('01234567')).toBe(true);
    expect(looksLikeGtin('012345678905')).toBe(true);
    expect(looksLikeGtin('HILLS-KD')).toBe(false);
  });
});

describe('productSchemaIdentifiers', () => {
  const productId = '507f1f77bcf86cd799439011';

  test('uses a valid SKU as both sku and mpn', () => {
    expect(productSchemaIdentifiers('PP-15', productId)).toEqual({
      sku: 'PP-15',
      mpn: 'PP-15',
    });
  });

  test('falls back to the product id and omits mpn when the SKU is too long', () => {
    expect(productSchemaIdentifiers('w'.repeat(74), productId)).toEqual({
      sku: productId,
    });
  });
});
