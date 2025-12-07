import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '@/types';
import { normalizeId } from '@/utils/idNormalizer';

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

// BroadcastChannel for cross-tab synchronization
let cartChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  cartChannel = new BroadcastChannel('cart-sync');
}

const broadcastCartUpdate = (items: CartItem[]) => {
  if (cartChannel) {
    cartChannel.postMessage({ type: 'cart-update', items });
  }
};

// Listen for cart updates from other tabs
if (cartChannel) {
  cartChannel.onmessage = (event) => {
    if (event.data.type === 'cart-update') {
      // Update cart from other tab
      useCartStore.getState().setItems(event.data.items);
    }
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, variant, quantity = 1) => {
        // Check if product/variant has stock
        const availableStock = variant?.stock || 0;
        
        // Silently reject if out of stock (UI already shows "Out of Stock" button disabled)
        if (availableStock === 0) {
          return;
        }

        // Normalize product ID to string to prevent ObjectId issues
        const normalizedId = normalizeId(product._id) || String(product._id);

        // Create normalized product with string _id
        const normalizedProduct = {
          ...product,
          _id: normalizedId
        };

        const items = get().items;
        const existingItemIndex = items.findIndex(
          (item) =>
            (normalizeId(item.product._id) || String(item.product._id)) === normalizedProduct._id &&
            item.variant?.sku === variant?.sku
        );

        if (existingItemIndex > -1) {
          const currentQuantity = items[existingItemIndex].quantity;
          const newQuantity = currentQuantity + quantity;
          
          // Check if new quantity exceeds available stock
          if (newQuantity > availableStock) {
            // Silently prevent exceeding stock
            return;
          }
          
          const newItems = [...items];
          newItems[existingItemIndex].quantity = newQuantity;
          set({ items: newItems });
        } else {
          // Check if requested quantity exceeds available stock
          if (quantity > availableStock) {
            // Silently prevent exceeding stock
            return;
          }
          
          set({ items: [...items, { product: normalizedProduct, variant, quantity }] });
        }
      },

      removeFromCart: (productId, variantSku) => {
        const normalizedProductId = normalizeId(productId) || String(productId);
        
        set({
          items: get().items.filter(
            (item) =>
              !((normalizeId(item.product._id) || String(item.product._id)) === normalizedProductId && item.variant?.sku === variantSku)
          )
        });
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
          
          // Check if new quantity exceeds available stock
          if (quantity > availableStock) {
            // Silently prevent exceeding stock (cart UI shows max stock)
            return;
          }
          
          const newItems = [...items];
          newItems[itemIndex].quantity = quantity;
          set({ items: newItems });
        }
      },

      clearCart: () => set({ items: [] }),

      setItems: (newItems: CartItem[]) => set({ items: newItems }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.variant?.price || item.product.basePrice;
          return total + price * item.quantity;
        }, 0);
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);



