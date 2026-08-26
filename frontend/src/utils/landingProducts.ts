import type { ProductFilters } from '@/services/products';

/**
 * Query used by SEO landing pages to fill "Recommended Products".
 * Do not AND every keyword together or require 4-star ratings — that left
 * the NYC delivery landings empty for shoppers and for Googlebot hydration.
 */
export function landingProductQuery(opts: {
  page: number;
  sort: string;
  petType?: string;
  category?: string;
}): ProductFilters {
  return {
    page: opts.page,
    limit: 20,
    sort: opts.sort as ProductFilters['sort'],
    petType: opts.petType || undefined,
    category: opts.category || undefined,
    inStock: true,
  };
}
