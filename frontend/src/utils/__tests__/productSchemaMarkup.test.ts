import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

const schemaSrc = fs.readFileSync(
  path.resolve(__dirname, '../../components/ProductSchema.tsx'),
  'utf8'
);

describe('ProductSchema Google shopping markup', () => {
  test('includes return policy and same-day NYC shipping Google needs for product cards', () => {
    expect(schemaSrc).toContain('hasMerchantReturnPolicy');
    expect(schemaSrc).toContain('returnPolicyCountry');
    expect(schemaSrc).toContain('merchantReturnLink');
    expect(schemaSrc).toContain('ReturnFeesCustomerResponsibility');
    expect(schemaSrc).not.toContain('FreeReturn');
    expect(schemaSrc).toContain("addressRegion: 'NY'");
    expect(schemaSrc).toContain('https://schema.org/SalePrice');
    expect(schemaSrc).not.toContain("minValue: 2");
  });
});
