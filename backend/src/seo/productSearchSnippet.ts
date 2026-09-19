/** Keep in sync with frontend/src/utils/seoUtils.ts productSearchTitle / productSearchDescription. */

const clipAtWord = (content: string, maxLength: number): string => {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const truncated = trimmed.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(maxLength * 0.5)
    ? truncated.substring(0, lastSpace)
    : truncated;
  return cut.replace(/[.,;:]+$/, '').trim();
};

export function productSearchTitle(opts: {
  name: string;
  brand?: string;
  inStock?: boolean;
}): string {
  let name = String(opts.name || 'Pet supplies').replace(/\s+/g, ' ').trim();
  const brand = String(opts.brand || '').trim();
  if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
    name = `${brand} ${name}`;
  }
  const stock = opts.inStock === false ? 'Out of stock' : 'In stock';
  return `${name} | ${stock} · free ship $49+ | Petshiwu`;
}

export function productSearchDescription(opts: {
  description?: string;
  brand?: string;
  name?: string;
  petType?: string;
  inStock?: boolean;
}): string {
  const stripped = String(opts.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const stockPhrase = opts.inStock === false ? 'Check stock.' : 'In stock.';
  const suffix = ` ${stockPhrase} Free shipping over $49. No autoship.`;
  const budget = Math.max(80, 160 - suffix.length);
  if (stripped) {
    return clipAtWord(`${clipAtWord(stripped, budget)}${suffix}`, 160);
  }
  const brand = opts.brand ? `${opts.brand} ` : '';
  const pet = opts.petType && opts.petType !== 'other-animals' ? opts.petType : 'pet';
  return clipAtWord(
    `Buy ${brand}${opts.name || 'this product'} for your ${pet} at Petshiwu.${suffix}`,
    160
  );
}
