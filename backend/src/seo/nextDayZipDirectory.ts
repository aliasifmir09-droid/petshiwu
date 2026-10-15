import { NEXT_DAY_ZIPS } from '../data/nextDayMetroZips';

export const NEXT_DAY_ZIP_COUNT = Object.keys(NEXT_DAY_ZIPS).length;

export function buildNextDayZipDirectoryHtml(): string {
  return `<div>
<h1>Same-day delivery in New York City</h1>
<p>Petshiwü delivers same-day across Manhattan, Brooklyn, Queens, the Bronx, and Staten Island for locally stocked items. The whole catalog arrives in 2-5 business days anywhere in the US except Alaska and Hawaii.</p>
<p><a href="https://www.petshiwu.com/shipping">Shipping information</a> · <a href="https://www.petshiwu.com/products">Shop in-stock</a></p>
</div>`;
}
