import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '@/types';
import { normalizeId } from '@/utils/idNormalizer';
import { trackAddToCart, trackRemoveFromCart } from '@/utils/analytics';

interface CartState {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (productId: string, variantSku?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

let cartChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  cartChannel = new BroadcastChannel('cart-sync');
}

const broadcastCartUpdate = (items: CartItem[]) => {
  if (cartChannel) {
    cartChannel.postMessage({ type: 'cart-update', items });
  }
};

if (cartChannel) {
  cartChannel.onmessage = (event) => {
    if (event.data.type === 'cart-update') {
      useCartStore.getState().setItems(event.data.items);
    }
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, variant, quantity = 1) => {
        const availableStock = variant?.stock || 0;
        if (availableStock === 0) return;

        const normalizedId = normalizeId(product._id) || String(product._id);
        const normalizedProduct = { ...product, _id: normalizedId };
        const items = get().items;

        const existingItemIndex = items.findIndex(
          (item) =>
            (normalizeId(item.product._id) || String(item.product._id)) === normalizedProduct._id &&
            item.variant?.sku === variant?.sku
        );

        if (existingItemIndex > -1) {
          const currentQuantity = items[existingItemIndex].quantity;
          const newQuantity = currentQuantity + quantity;
          if (newQuantity > availableStock) return;
          const newItems = [...items];
          newItems[existingItemIndex].quantity = newQuantity;
          set({ items: newItems });
          broadcastCartUpdate(newItems);
        } else {
          if (quantity > availableStock) return;
          const newItems = [...items, { product: normalizedProduct, variant, quantity }];
          set({ items: newItems });
          broadcastCartUpdate(newItems);
          const price = variant?.price || product.basePrice || 0;
          trackAddToCart(normalizedId, product.name, price, quantity);
        }
      },

      removeFromCart: (productId, variantSku) => {
        const normalizedProductId = normalizeId(productId) || String(productId);
        const itemToRemove = get().items.find(
          (item) =>
            (normalizeId(item.product._id) || String(item.product._id)) === normalizedProductId &&
            item.variant?.sku === variantSku
        );
        const newItems = get().items.filter(
          (item) =>
            !((normalizeId(item.product._id) || String(item.product._id)) === normalizedProductId &&
              item.variant?.sku === variantSku)
        );
        set({ items: newItems });
        broadcastCartUpdate(newItems);
        if (itemToRemove) {
          trackRemoveFromCart(normalizedProductId, itemToRemove.product.name);
        }
      },

      updateQuantity: (productId, quantity, variantSku) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, variantSku);
          return;
        }
        const normalizedProductId = normalizeId(productId) || String(productId);
        const items = get().items;
        const itemIndex = items.findIndex(
          (item) =>
            (normalizeId(item.product._id) || String(item.product._id)) === normalizedProductId &&
            item.variant?.sku === variantSku
        );
        if (itemIndex > -1) {
          const item = items[itemIndex];
          const availableStock = item.variant?.stock || 0;
          if (quantity > availableStock) return;
          const newItems = [...items];
          newItems[itemIndex].quantity = quantity;
          set({ items: newItems });
          broadcastCartUpdate(newItems);
        }
      },

      clearCart: () => {
        set({ items: [] });
        broadcastCartUpdate([]);
      },

      setItems: (newItems: CartItem[]) => {
        set({ items: newItems });
        broadcastCartUpdate(newItems);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + (Number(item?.quantity) || 0), 0);
      },

      // ✅ FIXED — NaN-safe, handles missing basePrice/price
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          try {
            const p = item?.variant?.price ?? item?.product?.basePrice ?? item?.product?.price ?? 0;
            const price = isNaN(Number(p)) ? 0 : Number(p);
            const qty = isNaN(Number(item?.quantity)) ? 1 : Number(item.quantity);
            return total + price * qty;
          } catch {
            return total;
          }
        }, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
