import { describe, expect, test } from 'vitest';
import {
  LOCAL_ONLY_PROMISE,
  LOCAL_SAME_DAY_PROMISE,
  NATIONWIDE_PRODUCT_PROMISE,
  cartShipsNationwide,
  localItemsBlockedOutsideNyc,
  productDeliveryPromise,
} from '../deliveryLane';

const local = { tags: ['dog'], name: 'Queens kibble' };
const shipped = { tags: ['topdawg', 'td-category'], name: 'Dropship toy' };

describe('product delivery promises', () => {
  test('old-catalog items never promise nationwide shipping', () => {
    expect(productDeliveryPromise(local, '11372')).toBe(LOCAL_SAME_DAY_PROMISE);
    expect(productDeliveryPromise(local, '')).toBe(LOCAL_SAME_DAY_PROMISE);
    expect(productDeliveryPromise(local, '07030')).toBe(LOCAL_ONLY_PROMISE);
    expect(productDeliveryPromise(local, '94105')).not.toMatch(/nationwide/i);
  });

  test('topdawg items promise 3-5 business day nationwide shipping', () => {
    expect(productDeliveryPromise(shipped, '11372')).toBe(NATIONWIDE_PRODUCT_PROMISE);
    expect(productDeliveryPromise(shipped, '07030')).toBe(NATIONWIDE_PRODUCT_PROMISE);
  });

  test('a non-NYC cart ships only when every item is TopDawg', () => {
    const hoboken = { state: 'NJ', zipCode: '07030', country: 'USA' };
    expect(cartShipsNationwide([{ product: shipped }], hoboken)).toBe(true);
    expect(cartShipsNationwide([{ product: shipped }, { product: local }], hoboken)).toBe(false);
    expect(localItemsBlockedOutsideNyc([{ product: local }], hoboken)).toBe(true);
    expect(localItemsBlockedOutsideNyc([{ product: shipped }, { product: local }], { state: 'NY', zipCode: '11372', country: 'USA' })).toBe(false);
  });
});
