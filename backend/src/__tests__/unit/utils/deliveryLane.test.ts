import Product from '../../../models/Product';
import { calculateTrustedOrderPricing } from '../../../services/orderPricingService';
import { quoteCartDelivery } from '../../../utils/deliveryLane';

jest.mock('../../../models/Product', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

const findById = Product.findById as jest.Mock;

function product(id: string, tags: string[], price: number, name: string) {
  return {
    _id: id,
    name,
    inStock: true,
    totalStock: 20,
    basePrice: price,
    variants: [],
    tags,
    images: ['https://example.com/item.jpg'],
  };
}

describe('two delivery lanes', () => {
  const topDawg = product('64b000000000000000000001', ['topdawg', 'td-category'], 20, 'Dropship toy');
  const local = product('64b000000000000000000002', ['dog'], 15, 'Queens kibble');

  beforeEach(() => {
    findById.mockReset();
  });

  test('non-NYC + all-TopDawg cart is allowed with a $7 flat fee', async () => {
    const quote = quoteCartDelivery({
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
      items: [{ tags: ['topdawg'], name: 'Dropship toy', price: 80, quantity: 1 }],
    });
    expect(quote.status).toBe(200);
    if (quote.status === 200) {
      expect(quote.lane).toBe('nationwide');
      expect(quote.shippingPrice).toBe(7);
    }

    findById.mockResolvedValue(topDawg);
    const pricing = await calculateTrustedOrderPricing(
      [{ product: topDawg._id, quantity: 2 }],
      undefined,
      0,
      undefined,
      'CA',
      '94105',
      'USA'
    );
    expect(pricing.shippingPrice).toBe(7);
    expect(pricing.items[0].product).toBe(topDawg._id);
    expect(pricing.totalPrice).toBe(Number((40 + 7).toFixed(2)));
  });

  test('non-NYC + one local item is rejected', async () => {
    const quote = quoteCartDelivery({
      state: 'NJ',
      zipCode: '07030',
      country: 'USA',
      items: [
        { tags: ['topdawg'], name: 'Dropship toy', price: 20, quantity: 1 },
        { tags: ['dog'], name: 'Queens kibble', price: 30, quantity: 1 },
      ],
    });
    expect(quote.status).toBe(400);
    if (quote.status === 400) {
      expect(quote.message).toMatch(/NYC same-day only/);
      expect(quote.message).toMatch(/Queens kibble/);
    }

    findById.mockImplementation((id: string) => Promise.resolve(id === local._id ? local : topDawg));
    await expect(
      calculateTrustedOrderPricing(
        [
          { product: topDawg._id, quantity: 1 },
          { product: local._id, quantity: 1 },
        ],
        undefined,
        0,
        undefined,
        'NJ',
        '07030',
        'USA'
      )
    ).rejects.toThrow(/NYC same-day only/);
  });

  test('NYC mixed cart keeps the $6 / free-over-$49 rule', async () => {
    const under = quoteCartDelivery({
      state: 'NY',
      zipCode: '11372',
      country: 'USA',
      items: [
        { tags: ['topdawg'], name: 'Dropship toy', price: 10, quantity: 1 },
        { tags: [], name: 'Queens kibble', price: 20, quantity: 1 },
      ],
    });
    expect(under.status).toBe(200);
    if (under.status === 200) expect(under.shippingPrice).toBe(6);

    const free = quoteCartDelivery({
      state: 'New York',
      zipCode: '10001',
      items: [
        { tags: ['topdawg'], name: 'Dropship toy', price: 40, quantity: 1 },
        { tags: ['dog'], name: 'Queens kibble', price: 9, quantity: 1 },
      ],
    });
    expect(free.status).toBe(200);
    if (free.status === 200) expect(free.shippingPrice).toBe(0);

    findById.mockImplementation((id: string) => Promise.resolve(id === local._id ? local : topDawg));
    const pricing = await calculateTrustedOrderPricing(
      [
        { product: topDawg._id, quantity: 1 },
        { product: local._id, quantity: 1 },
      ],
      undefined,
      0,
      undefined,
      'NY',
      '11372',
      'USA'
    );
    expect(pricing.shippingPrice).toBe(6);
    expect(pricing.items.map((item) => item.product)).toEqual([topDawg._id, local._id]);
  });

  test('international addresses stay rejected', () => {
    const quote = quoteCartDelivery({
      state: 'ON',
      zipCode: '94105',
      country: 'Canada',
      items: [{ tags: ['topdawg'], name: 'Dropship toy', price: 20, quantity: 1 }],
    });
    expect(quote.status).toBe(400);
  });
});
