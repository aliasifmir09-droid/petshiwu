import { productService } from '@/services/products';
import { Product, ProductVariant } from '@/types';

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

export function pickInStockVariant(
  product: Product,
  sku?: string
): ProductVariant | undefined {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const bySku = sku ? variants.find((v) => v.sku === sku && (v.stock || 0) > 0) : undefined;
  if (bySku) return bySku;
  const anyStock = variants.find((v) => (v.stock || 0) > 0);
  if (anyStock) return anyStock;
  if ((product.totalStock || 0) > 0) {
    return {
      sku: sku || 'default',
      stock: product.totalStock,
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
