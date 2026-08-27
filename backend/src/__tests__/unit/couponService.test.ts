import fs from 'fs';
import path from 'path';
import { COUPONS, getCouponDiscount, isReusableCoupon } from '../../services/couponService';

describe('couponService', () => {
  test('FREEDOM20 is 20% off capped at $10', () => {
    expect(getCouponDiscount('freedom20', 40)).toBe(8);
    expect(getCouponDiscount('FREEDOM20', 50)).toBe(10);
    expect(getCouponDiscount('FREEDOM20', 200)).toBe(10);
  });

  test('percent codes are not capped at the percent number in dollars', () => {
    expect(getCouponDiscount('WELCOME10', 200)).toBe(20);
    expect(getCouponDiscount('NYC10', 80)).toBe(8);
  });

  test('unknown codes do nothing', () => {
    expect(getCouponDiscount('NOTAREALCODE', 50)).toBe(0);
    expect(getCouponDiscount(undefined, 50)).toBe(0);
  });

  test('BDAYGIFT is 15% off and RESCUE10 is 10% off', () => {
    expect(getCouponDiscount('BDAYGIFT', 40)).toBe(6);
    expect(getCouponDiscount('bdaygift', 100)).toBe(15);
    expect(getCouponDiscount('RESCUE10', 50)).toBe(5);
  });

  test('advertised launch codes exist', () => {
    expect(COUPONS.FREEDOM20).toBeDefined();
    expect(COUPONS.WELCOME10).toBeDefined();
    expect(COUPONS.BDAYGIFT).toBeDefined();
    expect(COUPONS.RESCUE10).toBeDefined();
  });

  test('RESTOCK5 is reusable 5% off capped at $10 for reorder', () => {
    expect(COUPONS.RESTOCK5).toMatchObject({
      type: 'percent',
      value: 5,
      maxDiscount: 10,
      reusable: true,
    });
    expect(isReusableCoupon('restock5')).toBe(true);
    expect(getCouponDiscount('RESTOCK5', 50)).toBe(2.5);
    expect(getCouponDiscount('RESTOCK5', 200)).toBe(10);
  });

  test('RESTOCK7 is reusable 7% off capped at $10 for autoship', () => {
    expect(COUPONS.RESTOCK7).toMatchObject({
      type: 'percent',
      value: 7,
      maxDiscount: 10,
      reusable: true,
    });
    expect(isReusableCoupon('restock7')).toBe(true);
    expect(getCouponDiscount('RESTOCK7', 50)).toBe(3.5);
    expect(getCouponDiscount('RESTOCK7', 200)).toBe(10);
    expect(getCouponDiscount('restock7', 40)).toBe(2.8);
  });

  test('FAMILY15 is a private reusable 15% code with no dollar cap', () => {
    expect(COUPONS.FAMILY15).toMatchObject({
      type: 'percent',
      value: 15,
      reusable: true,
      hidden: true,
    });
    expect(COUPONS.FAMILY15.maxDiscount).toBeUndefined();
    expect(isReusableCoupon('family15')).toBe(true);
    expect(isReusableCoupon('WELCOME10')).toBe(false);
    expect(getCouponDiscount('FAMILY15', 40)).toBe(6);
    expect(getCouponDiscount('family15', 100)).toBe(15);
    expect(getCouponDiscount('FAMILY15', 200)).toBe(30);
  });

  test('FAMILY15 is not advertised in public storefront or marketing copy', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const publicRoots = [
      path.join(repoRoot, 'frontend/src'),
      path.join(repoRoot, 'frontend/public'),
    ];
    const publicFiles = [
      path.join(repoRoot, 'backend/src/controllers/aiAdvisorController.ts'),
      path.join(repoRoot, 'backend/src/workers/birthdayWorker.ts'),
      path.join(repoRoot, 'backend/src/middleware/botRenderer.ts'),
      path.join(repoRoot, 'backend/src/routes/newsletter.ts'),
      path.join(repoRoot, 'GBP_COPY.md'),
    ];

    const hits: string[] = [];
    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '__tests__') continue;
          walk(full);
          continue;
        }
        if (/\.(test|spec)\.(ts|tsx|js)$/.test(entry.name)) continue;
        if (!/\.(ts|tsx|js|jsx|html|xml|txt|md)$/.test(entry.name)) continue;
        const text = fs.readFileSync(full, 'utf8');
        if (/FAMILY15/i.test(text)) hits.push(path.relative(repoRoot, full));
      }
    };

    publicRoots.forEach(walk);
    for (const file of publicFiles) {
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, 'utf8');
      if (/FAMILY15/i.test(text)) hits.push(path.relative(repoRoot, file));
    }

    expect(hits).toEqual([]);
  });
});
