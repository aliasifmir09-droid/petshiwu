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

  test('a local item outside NY, NJ, and CT is refused without a crash', async () => {
    const quote = quoteCartDelivery({
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
      items: [
        { tags: ['topdawg'], name: 'Dropship toy', price: 20, quantity: 1 },
        { tags: ['dog'], name: 'Queens kibble', price: 30, quantity: 1 },
      ],
    });
    expect(quote.status).toBe(400);
    if (quote.status === 400) {
      expect(quote.message).toMatch(/not available for this address yet/i);
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
        'CA',
        '90001',
        'USA'
      )
    ).rejects.toThrow(/not available for this address yet/i);
  });

  test('NYC mixed cart adds the TopDawg flat fee to the same-day fee', async () => {
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
    if (under.status === 200) expect(under.shippingPrice).toBe(13);

    const free = quoteCartDelivery({
      state: 'New York',
      zipCode: '10001',
      items: [
        { tags: ['topdawg'], name: 'Dropship toy', price: 40, quantity: 1 },
        { tags: ['dog'], name: 'Queens kibble', price: 9, quantity: 1 },
      ],
    });
    expect(free.status).toBe(200);
    if (free.status === 200) expect(free.shippingPrice).toBe(7);

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
    expect(pricing.shippingPrice).toBe(13);
    expect(pricing.items.map((item) => item.product)).toEqual([topDawg._id, local._id]);
  });

  test('Alaska and Hawaii are refused for a TopDawg cart', () => {
    const item = [{ tags: ['topdawg'], name: 'Dropship toy', price: 20, quantity: 1 }];
    for (const address of [
      { state: 'AK', zipCode: '99501' },
      { state: 'Alaska', zipCode: '99501' },
      { state: 'HI', zipCode: '96813' },
      { state: 'Hawaii', zipCode: '96815' },
      { state: 'CA', zipCode: '96813' },
    ]) {
      const quote = quoteCartDelivery({ ...address, country: 'USA', items: item });
      expect(quote.status).toBe(400);
      if (quote.status === 400) expect(quote.message).toMatch(/Alaska or Hawaii/);
    }

    const california = quoteCartDelivery({
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
      items: item,
    });
    expect(california.status).toBe(200);
  });

  test('tri-state local carts are $7 under $49 and free at $49', () => {
    const hoboken = quoteCartDelivery({
      state: 'NJ',
      zipCode: '07030',
      country: 'USA',
      items: [{ tags: ['dog'], name: 'Queens kibble', price: 30, quantity: 1 }],
    });
    expect(hoboken.status).toBe(200);
    if (hoboken.status === 200) {
      expect(hoboken.lane).toBe('tri_state');
      expect(hoboken.shippingPrice).toBe(7);
    }

    const hartford = quoteCartDelivery({
      state: 'CT',
      zipCode: '06103',
      country: 'USA',
      items: [{ tags: ['dog'], name: 'Queens kibble', price: 49, quantity: 1 }],
    });
    expect(hartford.status).toBe(200);
    if (hartford.status === 200) expect(hartford.shippingPrice).toBe(0);

    const nycLocal = quoteCartDelivery({
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      items: [{ tags: ['dog'], name: 'Queens kibble', price: 20, quantity: 1 }],
    });
    expect(nycLocal.status).toBe(200);
    if (nycLocal.status === 200) expect(nycLocal.shippingPrice).toBe(6);

    const topDawgNj = quoteCartDelivery({
      state: 'NJ',
      zipCode: '07030',
      country: 'USA',
      items: [{ tags: ['topdawg'], name: 'Dropship toy', price: 80, quantity: 1 }],
    });
    expect(topDawgNj.status).toBe(200);
    if (topDawgNj.status === 200) expect(topDawgNj.shippingPrice).toBe(7);

    const mixed = quoteCartDelivery({
      state: 'NJ',
      zipCode: '07030',
      country: 'USA',
      items: [
        { tags: ['dog'], name: 'Queens kibble', price: 20, quantity: 1 },
        { tags: ['topdawg'], name: 'Dropship toy', price: 10, quantity: 1 },
      ],
    });
    expect(mixed.status).toBe(200);
    if (mixed.status === 200) expect(mixed.shippingPrice).toBe(14);
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
