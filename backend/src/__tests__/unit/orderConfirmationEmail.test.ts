import {
  absoluteImageUrl,
  buildOrderConfirmationEmail,
  escapeHtml,
  formatUsd,
  paymentMethodLabel,
} from '../../utils/orderConfirmationEmail';

const sample = {
  orderId: '6975f1965f8fb0a308f8d7af',
  items: [{
    name: 'Whisker City® 2-Door Pet Carrier',
    quantity: 1,
    price: 41.99,
    image: 'https://petshiwu-cdn.b-cdn.net/products/carrier.jpg',
  }],
  itemsPrice: 41.99,
  shippingPrice: 6,
  taxPrice: 3.36,
  totalPrice: 51.35,
  shippingAddress: {
    firstName: 'asdi',
    lastName: 'mir',
    street: '37-68 74th St',
    city: 'Queens',
    state: 'NY',
    zipCode: '11372',
    country: 'USA',
    phone: '12125551212',
  },
  paymentMethod: 'cod',
  orderStatus: 'pending',
  createdAt: new Date('2026-08-21T13:53:00Z'),
  customerEmail: 'asdi@example.com',
};

describe('order confirmation email', () => {
  const email = buildOrderConfirmationEmail('asdi', 'ORD-1787320995135-7555', sample);

  test('looks like a print-ready packing slip, not a dark emoji newsletter', () => {
    expect(email.subject).toBe('Your Petshiwu packing slip ORD-1787320995135-7555');
    expect(email.html).toContain('https://www.petshiwu.com/logo.png');
    expect(email.html).toContain('#1E3A8A');
    expect(email.html).toContain('Official receipt and packing slip');
    expect(email.html).toContain('Print this page and include it in the package');
    expect(email.html).toContain('@media print');
    expect(email.html).toContain('Ship to');
    expect(email.html).toContain('Ship from');
    expect(email.html).not.toContain('#071828');
    expect(email.html).not.toContain('For the love of pets');
    expect(email.html).not.toContain('🎉');
    expect(email.html).not.toContain('Admin Alert');
  });

  test('includes the details customers need to trust the order', () => {
    expect(email.html).toContain('Whisker City® 2-Door Pet Carrier');
    expect(email.html).toContain('$41.99');
    expect(email.html).toContain('$51.35');
    expect(email.html).toContain('Amount due on delivery');
    expect(email.html).toContain('Due when the driver arrives');
    expect(email.html).toContain('37-68 74th St');
    expect(email.html).toContain('Queens, NY 11372');
    expect(email.html).toContain('asdi@example.com');
    expect(email.html).toContain('Track this order');
    expect(email.html).toContain('/track-order?order=ORD-1787320995135-7555');
    expect(email.html).toContain('support@petshiwu.com');
    expect(email.html).toContain('365-day returns');
    expect(email.html).toContain('tel:+18002592605');
    expect(email.html).toContain('+1 (800) 259-2605');
    expect(email.html).toContain('We pack and deliver this order on August 28, 2026');
  });

  test('paypal copy is a paid receipt the warehouse can print', () => {
    const paid = buildOrderConfirmationEmail('asif', 'ORD-PAYPAL-1', {
      ...sample,
      paymentMethod: 'paypal',
      items: [{ name: 'Dubia Roach Large 25 Ct.', quantity: 1, price: 14.99 }],
      itemsPrice: 14.99,
      shippingPrice: 6,
      taxPrice: 1.2,
      totalPrice: 22.19,
      customerEmail: 'dubaiteamss@gmail.com',
      shippingAddress: {
        ...sample.shippingAddress,
        firstName: 'asif',
        lastName: 'ali',
        street: '37-68 74 stree',
      },
    });
    expect(paid.html).toContain('PayPal');
    expect(paid.html).toContain('Payment received');
    expect(paid.html).toContain('Total paid');
    expect(paid.html).toContain('$22.19');
    expect(paid.html).toContain('Dubia Roach Large 25 Ct.');
    expect(paid.html).toContain('dubaiteamss@gmail.com');
    expect(paid.html).toContain('asif ali');
  });

  test('escapes customer names in HTML', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    const hostile = buildOrderConfirmationEmail('<b>x</b>', 'ORD-1', {
      ...sample,
      customerEmail: 'a@b.com<script>',
      shippingAddress: { ...sample.shippingAddress, firstName: '<img>' },
    });
    expect(hostile.html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(hostile.html).not.toContain('<b>x</b>');
    expect(hostile.html).toContain('a@b.com&lt;script&gt;');
  });

  test('keeps a plain-text receipt for inbox filters', () => {
    expect(email.text).toContain('Whisker City® 2-Door Pet Carrier');
    expect(email.text).toContain('Call support 24/7: +1 (800) 259-2605');
    expect(email.text).toContain('support@petshiwu.com');
    expect(email.text).toContain('PACKING SLIP');
    expect(email.text).toContain('https://www.petshiwu.com/track-order?order=ORD-1787320995135-7555');
  });

  test('helpers format money, payment labels, and images', () => {
    expect(formatUsd(51.35)).toBe('$51.35');
    expect(paymentMethodLabel('cod')).toBe('Cash on delivery');
    expect(paymentMethodLabel('paypal')).toBe('PayPal');
    expect(absoluteImageUrl('/logo.png')).toBe('https://www.petshiwu.com/logo.png');
  });
});
