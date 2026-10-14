import { NEXT_DAY_ZIPS } from '../data/nextDayMetroZips';

export const NEXT_DAY_ZIP_COUNT = Object.keys(NEXT_DAY_ZIPS).length;

export function buildNextDayZipDirectoryHtml(): string {
  return `<div>
<h1>Same-day delivery in New York City</h1>
<p>Petshiwü delivers same-day across Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. In-stock products are eligible for same-day delivery in NYC. Delivery outside New York City, including New Jersey and Connecticut, is closed. Nationwide shipping soon.</p>
<p><a href="https://www.petshiwu.com/shipping">Shipping information</a> · <a href="https://www.petshiwu.com/products">Shop in-stock</a></p>
</div>`;
}
