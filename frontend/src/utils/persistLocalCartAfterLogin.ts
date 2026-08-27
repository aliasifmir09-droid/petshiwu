import { useCartStore } from '@/stores/cartStore';
import cartService from '@/services/cart';

const toSavePayload = () =>
  useCartStore.getState().items.map((item) => ({
    product: String(item.product?._id || ''),
    variant: item.variant || undefined,
    quantity: item.quantity,
    price: item.variant?.price ?? item.product?.basePrice ?? 0,
    name: item.product?.name || 'Product',
    image: item.product?.images?.[0] || '',
  })).filter((item) => item.product);

/** Keep the browser cart and attach it to the logged-in account. */
export const persistLocalCartAfterLogin = async (): Promise<void> => {
  const items = toSavePayload();
  if (items.length === 0) return;
  try {
    await cartService.saveCart(items);
  } catch {
    // Local cart still works if the server save fails.
  }
};
