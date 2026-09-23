import { firstInStockVariantSku, needsStockBackfill, plannedStock } from '../../../utils/productStock';

describe('product stock backfill planner', () => {
  test('sums variant stock when totalStock is missing or zero', () => {
    expect(
      plannedStock({
        _id: '1',
        totalStock: 0,
        variants: [{ stock: 30 }, { stock: 30 }],
      })
    ).toEqual({ totalStock: 60, inStock: true });
  });

  test('flags documents Googlebot would treat as empty', () => {
    expect(
      needsStockBackfill({
        _id: '1',
        totalStock: 0,
        inStock: true,
        variants: [{ stock: 12 }],
      })
    ).toBe(true);
    expect(
      needsStockBackfill({
        _id: '2',
        totalStock: 12,
        inStock: true,
        variants: [{ stock: 12 }],
      })
    ).toBe(false);
  });

  test('picks the first variant with enough stock', () => {
    expect(
      firstInStockVariantSku(
        {
          variants: [
            { sku: 'A', stock: 0 },
            { sku: 'B', stock: 8 },
          ],
        },
        2
      )
    ).toBe('B');
  });
});
