import { describe, expect, test } from 'vitest';
import { ProductVariant } from '@/types';
import {
  collectVariantAttrs,
  findVariantIndex,
  formatOptionLabel,
  getVariantDimensions,
  parseWeightLbs,
  pricePerLb,
} from '../productVariants';

const bag = (size: string, price: number, sku: string): ProductVariant => ({
  size,
  weight: size,
  price,
  stock: 10,
  sku,
  attributes: {},
});

describe('getVariantDimensions', () => {
  test('merges duplicate size and weight bag options into one Size row', () => {
    const dimensions = getVariantDimensions([
      bag('5 Lb', 16.99, '5'),
      bag('15 Lb', 39.99, '15'),
      bag('24 Lb', 54.99, '24'),
      bag('30 Lb', 75.49, '30'),
      bag('34 Lb', 82.49, '34'),
    ]);
    expect(dimensions).toHaveLength(1);
    expect(dimensions[0]).toMatchObject({ key: 'size', label: 'Size', kind: 'size' });
    expect(dimensions[0].values).toEqual(['5 Lb', '15 Lb', '24 Lb', '30 Lb', '34 Lb']);
  });

  test('keeps flavor separate from bag size', () => {
    const dimensions = getVariantDimensions([
      { size: '5 lb', price: 10, stock: 4, sku: 'c5', attributes: { flavor: 'Chicken' } },
      { size: '5 lb', price: 11, stock: 4, sku: 's5', attributes: { flavor: 'Salmon' } },
      { size: '15 lb', price: 30, stock: 4, sku: 'c15', attributes: { flavor: 'Chicken' } },
    ]);
    expect(dimensions.map((d) => d.key)).toEqual(['size', 'flavor']);
    expect(dimensions[1].values).toEqual(['Chicken', 'Salmon']);
  });

  test('does not merge size names with a different weight', () => {
    const dimensions = getVariantDimensions([
      { size: 'Small', weight: '5 lb', price: 12, stock: 2, sku: 's', attributes: {} },
      { size: 'Large', weight: '15 lb', price: 28, stock: 2, sku: 'l', attributes: {} },
    ]);
    expect(dimensions.map((d) => `${d.key}:${d.label}`).sort()).toEqual(['size:Size', 'weight:Weight']);
  });
});

describe('variant helpers', () => {
  test('collectVariantAttrs ignores empty attribute objects', () => {
    expect(collectVariantAttrs(bag('5 Lb', 16.99, '5'))).toEqual({
      size: '5 Lb',
      weight: '5 Lb',
    });
  });

  test('findVariantIndex matches the selected bag', () => {
    const variants = [bag('5 Lb', 16.99, '5'), bag('34 Lb', 82.49, '34')];
    expect(findVariantIndex(variants, { size: '34 Lb' })).toBe(1);
  });

  test('formatOptionLabel standardizes bag weights', () => {
    expect(formatOptionLabel('5 Lb', 'size')).toBe('5 lb');
    expect(formatOptionLabel('34 LB', 'size')).toBe('34 lb');
    expect(formatOptionLabel('Chicken', 'flavor')).toBe('Chicken');
  });

  test('price per lb uses the bag weight', () => {
    expect(parseWeightLbs('5 Lb')).toBe(5);
    expect(pricePerLb(16.99, '5 Lb')?.toFixed(2)).toBe('3.40');
  });
});
