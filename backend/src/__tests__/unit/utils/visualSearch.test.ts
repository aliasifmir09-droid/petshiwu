import {
  mimeFromDataUrl,
  parseVisualIdentification,
  visualSearchTerms,
} from '../../../utils/visualSearch';

describe('visual search identification', () => {
  test('parses a product-package Gemini payload', () => {
    const identified = parseVisualIdentification({
      productType: 'Dog Food',
      keywords: ['chicken', 'adult', 'dry'],
      petType: 'dog',
      brand: 'Purina',
      description: 'A bag of Purina adult dog food.',
    });
    expect(identified?.productType).toBe('dog food');
    expect(identified?.petType).toBe('dog');
    expect(identified?.brand).toBe('Purina');
    expect(visualSearchTerms(identified!)).toEqual(
      expect.arrayContaining(['dog', 'food', 'chicken', 'adult', 'dry', 'purina'])
    );
  });

  test('maps small-animal to small-pet and ignores unknown brand', () => {
    const identified = parseVisualIdentification({
      productType: 'hay',
      keywords: [],
      petType: 'small-animal',
      brand: 'null',
      description: 'A rabbit eating hay.',
    });
    expect(identified?.petType).toBe('small-pet');
    expect(identified?.brand).toBeNull();
  });

  test('returns null for unknown or missing product type', () => {
    expect(parseVisualIdentification({ productType: 'unknown' })).toBeNull();
    expect(parseVisualIdentification({ productType: null })).toBeNull();
    expect(parseVisualIdentification(null)).toBeNull();
  });

  test('reads mime type from a data URL', () => {
    expect(mimeFromDataUrl('data:image/png;base64,aaa', 'image/jpeg')).toBe('image/png');
    expect(mimeFromDataUrl('abcdef')).toBe('image/jpeg');
  });
});
