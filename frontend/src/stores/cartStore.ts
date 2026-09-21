import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '@/types';
import { normalizeId } from '@/utils/idNormalizer';
import { trackAddToCart, trackRemoveFromCart } from '@/utils/analytics';
import { availableCartStock } from '@/utils/cartStock';
import { cartLinePrice, cartSnapshotsEqual, cloneCartItems } from '@/utils/cartItems';

interface CartState {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => boolean;
  removeFromCart: (productId: string, variantSku?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  replaceItemsFromSync: (items: CartItem[]) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

let cartChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  cartChannel = new BroadcastChannel('cart-sync');
}

const broadcastCartUpdate = (items: CartItem[]) => {
  if (!cartChannel) return;
  cartChannel.postMessage({ type: 'cart-update', items });
};

const sameLine = (item: CartItem, productId: string, variantSku?: string) =>
  (normalizeId(item.product._id) || String(item.product._id)) === productId &&
  item.variant?.sku === variantSku;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      const commitItems = (nextItems: CartItem[], broadcast: boolean) => {
        const items = cloneCartItems(nextItems);
        if (cartSnapshotsEqual(get().items, items)) return false;
        set({ items });
        if (broadcast) broadcastCartUpdate(items);
        return true;
      };

      return {
        items: [],

        addToCart: (product, variant, quantity = 1) => {
          const availableStock = availableCartStock(product, variant);
          if (availableStock <= 0) return false;

          const normalizedId = normalizeId(product._id) || String(product._id);
          const normalizedProduct = { ...product, _id: normalizedId };
          const items = get().items;

          const existingItemIndex = items.findIndex((item) => sameLine(item, normalizedProduct._id, variant?.sku));

          if (existingItemIndex > -1) {
            const currentQuantity = items[existingItemIndex].quantity;
            const newQuantity = currentQuantity + quantity;
            if (newQuantity > availableStock) return false;
            const newItems = items.map((item, index) =>
              index === existingItemIndex ? { ...item, quantity: newQuantity } : item
            );
            commitItems(newItems, true);
            return true;
          }

          if (quantity > availableStock) return false;
          const newItems = [...items, { product: normalizedProduct, variant, quantity }];
          commitItems(newItems, true);
          const price = variant?.price || product.basePrice || 0;
          trackAddToCart(normalizedId, product.name, price, quantity);
          return true;
        },

        removeFromCart: (productId, variantSku) => {
          const normalizedProductId = normalizeId(productId) || String(productId);
          const itemToRemove = get().items.find((item) => sameLine(item, normalizedProductId, variantSku));
          const newItems = get().items.filter((item) => !sameLine(item, normalizedProductId, variantSku));
          commitItems(newItems, true);
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
          const itemIndex = items.findIndex((item) => sameLine(item, normalizedProductId, variantSku));
          if (itemIndex > -1) {
            const item = items[itemIndex];
            const availableStock = availableCartStock(item.product, item.variant);
            if (quantity > availableStock) return;
            const newItems = items.map((row, index) =>
              index === itemIndex ? { ...row, quantity } : row
            );
            commitItems(newItems, true);
          }
        },

        clearCart: () => {
          commitItems([], true);
        },

        setItems: (newItems: CartItem[]) => {
          commitItems(newItems, true);
        },

        replaceItemsFromSync: (newItems: CartItem[]) => {
          commitItems(newItems, false);
        },

        getTotalItems: () => {
          return get().items.reduce((total, item) => total + (Number(item?.quantity) || 0), 0);
        },

        getTotalPrice: () => {
          return get().items.reduce((total, item) => {
            try {
              return total + cartLinePrice(item) * (Number(item?.quantity) || 0);
            } catch {
              return total;
            }
          }, 0);
        },
      };
    },
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

if (cartChannel) {
  cartChannel.onmessage = (event) => {
    if (event.data?.type === 'cart-update' && Array.isArray(event.data.items)) {
      useCartStore.getState().replaceItemsFromSync(event.data.items);
    }
  };
}

/** False until zustand persist has read cart-storage. Avoids empty-cart flashes. */
export const useCartHasHydrated = (): boolean => {
  const [hydrated, setHydrated] = useState(() => {
    if (typeof useCartStore.persist?.hasHydrated === 'function') {
      return useCartStore.persist.hasHydrated();
    }
    return true;
  });

  useEffect(() => {
    const persistApi = useCartStore.persist;
    if (!persistApi?.onFinishHydration) {
      setHydrated(true);
      return;
    }
    const unsub = persistApi.onFinishHydration(() => setHydrated(true));
    if (persistApi.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
};
