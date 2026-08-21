import {
  assembleMerchantFeed,
  buildMerchantItemXml,
  canonicalProductUrl,
  cleanText,
  feedItemsForProduct,
  googleProductCategory,
  looksLikeGtin,
  merchantMpn,
  parseUnitPricing,
  productImages,
  xmlEscape,
} from '../../../utils/googleMerchantFeed';

describe('googleMerchantFeed helpers', () => {
  test('canonical URL uses pet type + category, not /products/slug', () => {
    expect(
      canonicalProductUrl({
        _id: 'abc',
        name: "Hill's Science Diet Adult",
        slug: 'hills-science-diet-adult',
        petType: 'dog',
        category: { name: 'Dry Food', slug: 'dry-food' },
      })
    ).toBe('https://www.petshiwu.com/dog/dry-food/hills-science-diet-adult');
  });

  test('maps dog food to Google product category', () => {
    expect(googleProductCategory('dog', 'Dry Food')).toBe(
      'Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Food'
    );
    expect(googleProductCategory('cat', 'Clumping Litter')).toContain('Cat Litter');
  });

  test('parses bag weight for unit pricing like $1.12/lb', () => {
    expect(parseUnitPricing('Adult Dog Food 30 lb')).toEqual({
      measure: '30 lb',
      base: '1 lb',
    });
    expect(parseUnitPricing('5-lb bag')).toEqual({ measure: '5 lb', base: '1 lb' });
  });

  test('treats 12-digit SKUs as GTINs and others as MPN', () => {
    expect(looksLikeGtin('012345678901')).toBe(true);
    expect(looksLikeGtin('HILLS-ADULT-30')).toBe(false);
  });

  test('omits MPNs outside Google\'s 1–70 character limit', () => {
    expect(merchantMpn('MM-30')).toBe('MM-30');
    expect(merchantMpn('')).toBeUndefined();
    expect(merchantMpn('x'.repeat(71))).toBeUndefined();
  });

  test('rewrites Cloudinary photos to Bunny so Google can fetch them', () => {
    expect(
      productImages({
        _id: '6975f1965f8fb0a308f8d7af',
        name: 'Carrier',
        slug: 'carrier',
        cloudinaryImage:
          'https://res.cloudinary.com/dtmes0dha/image/upload/v1779056475/petshiwu/products/6975f1965f8fb0a308f8d7af.jpg',
      })
    ).toEqual(['https://petshiwu-cdn.b-cdn.net/products/6975f1965f8fb0a308f8d7af.jpg']);
  });

  test('prefers an existing Bunny URL over a dead Cloudinary URL', () => {
    expect(
      productImages({
        _id: '1',
        name: 'Food',
        slug: 'food',
        bunnyImage: 'https://petshiwu-cdn.b-cdn.net/products/food.jpg',
        cloudinaryImage: 'https://res.cloudinary.com/dtmes0dha/image/upload/v1/petshiwu/products/food.jpg',
      })
    ).toEqual(['https://petshiwu-cdn.b-cdn.net/products/food.jpg']);
  });

  test('skips generic og-image stand-ins and keeps real CDN photos', () => {
    expect(
      productImages({
        _id: '1',
        name: 'Food',
        slug: 'food',
        images: ['https://petshiwu-cdn.b-cdn.net/products/food.jpg'],
      })
    ).toEqual(['https://petshiwu-cdn.b-cdn.net/products/food.jpg']);

    expect(
      productImages({
        _id: '1',
        name: 'Food',
        slug: 'food',
        images: ['https://www.petshiwu.com/og-image.jpg'],
      })
    ).toEqual([]);
  });

  test('item XML has the fields Google needs for Popular products', () => {
    const xml = buildMerchantItemXml({
      id: 'ps-123',
      title: 'Meow Mix Original Dry Cat Food 30 lb',
      description: cleanText('Complete and balanced dry cat food'),
      link: 'https://www.petshiwu.com/cat/dry-food/meow-mix-original',
      image: 'https://petshiwu-cdn.b-cdn.net/products/meow.jpg',
      extraImages: ['https://petshiwu-cdn.b-cdn.net/products/meow-2.jpg'],
      price: 22.99,
      salePrice: 17.99,
      availability: 'in stock',
      brand: 'Meow Mix',
      mpn: 'MM-30',
      productType: 'Cat Supplies > Dry Food',
      googleCategory: 'Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Food',
      petLabel: 'Cat',
      size: '30 lb',
      featured: true,
    });

    expect(xml).toContain('<g:id>ps-123</g:id>');
    expect(xml).toContain('<g:canonical_link>https://www.petshiwu.com/cat/dry-food/meow-mix-original</g:canonical_link>');
    expect(xml).toContain('<g:availability>in stock</g:availability>');
    expect(xml).toContain('<g:price>22.99 USD</g:price>');
    expect(xml).toContain('<g:sale_price>17.99 USD</g:sale_price>');
    expect(xml).toContain('<g:brand>Meow Mix</g:brand>');
    expect(xml).toContain('<g:mpn>MM-30</g:mpn>');
    expect(xml).toContain('<g:google_product_category>');
    expect(xml).toContain('<g:additional_image_link>https://petshiwu-cdn.b-cdn.net/products/meow-2.jpg</g:additional_image_link>');
    expect(xml).toContain('<g:unit_pricing_measure>30 lb</g:unit_pricing_measure>');
    expect(xml).toContain('<g:service>Same-day NYC</g:service>');
    expect(xml).toContain('<g:region>NY</g:region>');
    expect(xml).toContain('<g:min_transit_time>0</g:min_transit_time>');
    expect(xml).not.toContain('<g:identifier_exists>no</g:identifier_exists>');
  });

  test('does not emit a truncated MPN when the SKU is longer than 70 characters', () => {
    const xml = buildMerchantItemXml({
      id: 'ps-long',
      title: 'PetSafe Cat Flap',
      description: cleanText('Cat flap'),
      link: 'https://www.petshiwu.com/cat/doors/petsafe-cat-flap',
      image: 'https://petshiwu-cdn.b-cdn.net/products/flap.jpg',
      price: 44.99,
      availability: 'in stock',
      brand: 'PetSafe',
      mpn: merchantMpn('petsafe®-cat-flap:-2-way-locking---built-in-lock---durable---easy-install---hardware-kit-i'),
      productType: 'Cat Supplies > Doors',
      googleCategory: 'Animals & Pet Supplies > Pet Supplies > Cat Supplies',
      petLabel: 'Cat',
    });

    expect(xml).not.toContain('<g:mpn>');
    expect(xml).toContain('<g:identifier_exists>no</g:identifier_exists>');
  });

  test('feed items never point Google at the disabled Cloudinary cloud', () => {
    const xml = feedItemsForProduct({
      _id: '6975f1965f8fb0a308f8d7af',
      name: 'Whisker City Carrier',
      slug: 'whisker-city-carrier',
      petType: 'cat',
      brand: 'Whisker City',
      category: { name: 'Carriers', slug: 'carriers' },
      images: [
        'https://res.cloudinary.com/dtmes0dha/image/upload/v1779056475/petshiwu/products/6975f1965f8fb0a308f8d7af.jpg',
      ],
      inStock: true,
      variants: [{ price: 29.99, stock: 3, sku: 'WC-19' }],
    });

    expect(xml).toContain('<g:image_link>https://petshiwu-cdn.b-cdn.net/products/6975f1965f8fb0a308f8d7af.jpg</g:image_link>');
    expect(xml).not.toContain('res.cloudinary.com');
  });

  test('feedItemsForProduct omits oversized imported SKUs from g:mpn', () => {
    const longSku =
      'whisker-city-black-mesh-soft-sided-cat-dog-carrier-19-in-oversized-sku-xx';
    expect(longSku.length).toBeGreaterThan(70);

    const xml = feedItemsForProduct({
      _id: '507f1f77bcf86cd799439012',
      name: 'Whisker City Black Mesh Carrier',
      slug: 'whisker-city-black-mesh-soft-sided-cat-dog-carrier-19-in',
      petType: 'cat',
      brand: 'Whisker City',
      category: { name: 'Carriers', slug: 'carriers' },
      images: ['https://cdn.example.com/carrier.jpg'],
      inStock: true,
      variants: [{ price: 29.99, stock: 3, sku: longSku }],
    });

    expect(xml).not.toContain('<g:mpn>');
    expect(xml).toContain('<g:identifier_exists>no</g:identifier_exists>');
  });

  test('feedItemsForProduct emits one item per in-stock variant', () => {
    const xml = feedItemsForProduct({
      _id: '507f1f77bcf86cd799439011',
      name: 'Purina Pro Plan Adult',
      slug: 'purina-pro-plan-adult',
      petType: 'dog',
      brand: 'Purina',
      category: { name: 'Dry Food', slug: 'dry-food' },
      images: ['https://cdn.example.com/purina.jpg'],
      inStock: true,
      variants: [
        { price: 24.99, stock: 4, sku: 'PP-15', size: '15 lb' },
        { price: 39.99, stock: 0, sku: 'PP-30', size: '30 lb' },
      ],
    });

    expect(xml).toContain('<g:item_group_id>');
    expect(xml).toContain('Purina Pro Plan Adult - 15 lb');
    expect(xml).toContain('Purina Pro Plan Adult - 30 lb');
    expect(xml).toContain('<g:availability>in stock</g:availability>');
    expect(xml).toContain('<g:availability>out of stock</g:availability>');
    expect(xml).toContain('/dog/dry-food/purina-pro-plan-adult');
  });

  test('products without a real photo are omitted', () => {
    expect(
      feedItemsForProduct({
        _id: '1',
        name: 'No photo',
        slug: 'no-photo',
        basePrice: 10,
        images: [],
      })
    ).toBe('');
  });

  test('strips illegal XML control characters so one product cannot break the file', () => {
    expect(xmlEscape('Cat\u0000 door')).toBe('Cat door');
  });

  test('assembleMerchantFeed is a complete RSS document Google can parse', () => {
    const xml = assembleMerchantFeed([
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Purina Pro Plan Adult',
        slug: 'purina-pro-plan-adult',
        petType: 'dog',
        brand: 'Purina',
        category: { name: 'Dry Food', slug: 'dry-food' },
        images: ['https://cdn.example.com/purina.jpg'],
        inStock: true,
        variants: [{ price: 24.99, stock: 4, sku: 'PP-15', size: '15 lb' }],
      },
    ]);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain('<item>');
    expect(xml).toContain('</channel>');
    expect(xml.trimEnd().endsWith('</rss>')).toBe(true);
    expect((xml.match(/<item>/g) || []).length).toBe(1);
  });
});
