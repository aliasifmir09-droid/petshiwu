import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import HomeHeroSlogans from '@/components/HomeHeroSlogans';
import {
  DELIVERY_ZONE,
  HERO_H1,
  LOCAL_OUTSIDE_TRISTATE_ZONE,
  resolveDeliveryZone,
} from '../deliveryZones';
import { quoteStorefrontDelivery } from '../deliveryLane';

const local = { tags: ['dog'], name: 'Queens kibble' };
const shipped = { tags: ['topdawg'], name: 'Dropship toy' };

describe('resolveDeliveryZone', () => {
  test('NYC local is same-day and TopDawg stays nationwide', () => {
    expect(resolveDeliveryZone({ state: 'NY', zipCode: '10001' }, local)).toBe(DELIVERY_ZONE.SAME_DAY_NYC);
    expect(resolveDeliveryZone({ state: 'NY', zipCode: '11372' }, local)).toBe(DELIVERY_ZONE.SAME_DAY_NYC);
    expect(resolveDeliveryZone({ state: 'NY', zipCode: '10001' }, shipped)).toBe(DELIVERY_ZONE.NATIONWIDE);
    expect(resolveDeliveryZone('NJ', shipped)).toBe(DELIVERY_ZONE.NATIONWIDE);
  });

  test('NY, NJ, and CT outside NYC are tri-state for local stock', () => {
    expect(resolveDeliveryZone({ state: 'NJ', zipCode: '07030' }, local)).toBe(DELIVERY_ZONE.TRI_STATE);
    expect(resolveDeliveryZone({ state: 'CT', zipCode: '06103' }, local)).toBe(DELIVERY_ZONE.TRI_STATE);
    expect(resolveDeliveryZone({ zipCode: '11801' }, local)).toBe(DELIVERY_ZONE.TRI_STATE);
    expect(resolveDeliveryZone({ state: 'CA', zipCode: '90001' }, local)).toBe(LOCAL_OUTSIDE_TRISTATE_ZONE);
  });
});

describe('per-item fees', () => {
  test('mixed carts add the same-day or tri-state fee to the flat $7', () => {
    const nyc = quoteStorefrontDelivery({
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      items: [
        { product: local, price: 20, quantity: 1 },
        { product: shipped, price: 10, quantity: 1 },
      ],
    });
    expect(nyc.ok && nyc.shippingPrice).toBe(13);

    const freeLocalPlusTopDawg = quoteStorefrontDelivery({
      state: 'NY',
      zipCode: '11372',
      country: 'USA',
      items: [
        { product: local, price: 40, quantity: 1 },
        { product: shipped, price: 9, quantity: 1 },
      ],
    });
    expect(freeLocalPlusTopDawg.ok && freeLocalPlusTopDawg.localFee).toBe(0);
    expect(freeLocalPlusTopDawg.ok && freeLocalPlusTopDawg.nationwideFee).toBe(7);

    const nj = quoteStorefrontDelivery({
      state: 'NJ',
      zipCode: '07030',
      country: 'USA',
      items: [
        { product: local, price: 20, quantity: 1 },
        { product: shipped, price: 10, quantity: 1 },
      ],
    });
    expect(nj.ok && nj.shippingPrice).toBe(14);

    const njFree = quoteStorefrontDelivery({
      state: 'CT',
      zipCode: '06103',
      country: 'USA',
      items: [{ product: local, price: 49, quantity: 1 }],
    });
    expect(njFree.ok && njFree.shippingPrice).toBe(0);

    const californiaLocal = quoteStorefrontDelivery({
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
      items: [{ product: local, price: 20, quantity: 1 }],
    });
    expect(californiaLocal.ok).toBe(false);

    const californiaShipped = quoteStorefrontDelivery({
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
      items: [{ product: shipped, price: 80, quantity: 1 }],
    });
    expect(californiaShipped.ok && californiaShipped.shippingPrice).toBe(7);
  });
});

describe('rendered delivery HTML', () => {
  test('homepage hero and the noscript document share the nationwide H1', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(HomeHeroSlogans))
    );
    expect(html).toContain(`<h1`);
    expect(html).toContain(HERO_H1);
    expect(html).not.toContain('Delivered to NYC');

    const index = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../index.html'), 'utf8');
    expect(index).toContain(`<h1>${HERO_H1}</h1>`);
    expect(index).not.toMatch(/Delivered to NYC/);
  });
});
