import { extractHexId, isOrderIdentifier, isOrderNumber, isStrictObjectId } from '../../utils/orderIdentity';

describe('orderIdentity', () => {
  it('accepts Mongo ObjectIds and ORD numbers', () => {
    expect(isStrictObjectId('507f1f77bcf86cd799439011')).toBe(true);
    expect(isOrderNumber('ORD-1787684558761-8401')).toBe(true);
    expect(isOrderIdentifier('ORD-1787684558761-8401')).toBe(true);
    expect(isOrderIdentifier('[object Object]')).toBe(false);
    expect(isOrderIdentifier('not-an-id')).toBe(false);
  });

  it('extracts hex ids from BSON-like shapes', () => {
    const hex = '507f1f77bcf86cd799439011';
    expect(extractHexId(hex)).toBe(hex);
    expect(extractHexId({ $oid: hex })).toBe(hex);
    expect(extractHexId({ toHexString: () => hex })).toBe(hex);
    expect(extractHexId('[object Object]')).toBe('');
    expect(extractHexId({
      buffer: { 0: 0x50, 1: 0x7f, 2: 0x1f, 3: 0x77, 4: 0xbc, 5: 0xf8, 6: 0x6c, 7: 0xd7, 8: 0x99, 9: 0x43, 10: 0x90, 11: 0x11 }
    })).toBe(hex);
  });
});
