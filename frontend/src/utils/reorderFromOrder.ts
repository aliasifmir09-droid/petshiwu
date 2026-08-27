import { productService } from '@/services/products';
import { Product, ProductVariant } from '@/types';
import { availableCartStock } from '@/utils/cartStock';

export function orderItemProductId(item: { product?: unknown }): string {
  const product = item.product;
  if (!product) return '';
  if (typeof product === 'string') return product;
  if (typeof product === 'object' && product !== null) {
    const rec = product as { _id?: unknown; id?: unknown };
    if (rec._id) return String(rec._id);
    if (rec.id) return String(rec.id);
  }
  return String(product);
}

const restockStock = (product: Product, variant?: ProductVariant | null): number => {
  const listed = availableCartStock(product, variant || null);
  if (listed > 0) return listed;
  if (product.inStock) return 1;
  return 0;
};

export function pickInStockVariant(
  product: Product,
  sku?: string
): ProductVariant | undefined {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const bySku = sku ? variants.find((v) => v.sku === sku) : undefined;
  const ranked = [...(bySku ? [bySku] : []), ...variants.filter((v) => v !== bySku)];
  const chosen = ranked.find((variant) => restockStock(product, variant) > 0);
  if (chosen) {
    return { ...chosen, stock: restockStock(product, chosen) };
  }
  if (restockStock(product) > 0) {
    return {
      sku: sku || 'default',
      stock: restockStock(product),
      price: product.basePrice,
    } as ProductVariant;
  }
  return undefined;
}

export async function productsForReorder(
  items: Array<{ product?: unknown; variant?: { sku?: string }; quantity: number }>
): Promise<Array<{ product: Product; variant: ProductVariant; quantity: number }>> {
  const ready: Array<{ product: Product; variant: ProductVariant; quantity: number }> = [];
  for (const item of items) {
    const id = orderItemProductId(item);
    if (!id) continue;
    try {
      const product = await productService.getProductById(id);
      if (!product) continue;
      const variant = pickInStockVariant(product, item.variant?.sku);
      if (!variant) continue;
      ready.push({ product, variant, quantity: item.quantity || 1 });
    } catch {
      // Skip discontinued items
    }
  }
  return ready;
}
