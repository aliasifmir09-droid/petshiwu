import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '@/types';

interface CartState {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (productId: string, variantSku?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
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
        const normalizeId = (id: any): string => {
          if (typeof id === 'string') return id;
          if (id && typeof id === 'object') {
            if (typeof id.toString === 'function') {
              const str = id.toString();
              if (str && str !== '[object Object]') return str;
            }
            if (id._id) return normalizeId(id._id);
            if (id.id) return normalizeId(id.id);
            if (id.$oid) return String(id.$oid);
            if (id.oid) return String(id.oid);
          }
          return String(id);
        };

        // Create normalized product with string _id
        const normalizedProduct = {
          ...product,
          _id: normalizeId(product._id)
        };

        const items = get().items;
        const existingItemIndex = items.findIndex(
          (item) =>
            normalizeId(item.product._id) === normalizedProduct._id &&
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
        const normalizeId = (id: any): string => {
          if (typeof id === 'string') return id;
          if (id && typeof id === 'object') {
            if (typeof id.toString === 'function') {
              const str = id.toString();
              if (str && str !== '[object Object]') return str;
            }
            if (id._id) return normalizeId(id._id);
            if (id.id) return normalizeId(id.id);
            if (id.$oid) return String(id.$oid);
            if (id.oid) return String(id.oid);
          }
          return String(id);
        };
        
        set({
          items: get().items.filter(
            (item) =>
              !(normalizeId(item.product._id) === normalizeId(productId) && item.variant?.sku === variantSku)
          )
        });
      },

      updateQuantity: (productId, quantity, variantSku) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, variantSku);
          return;
        }

        const normalizeId = (id: any): string => {
          if (typeof id === 'string') return id;
          if (id && typeof id === 'object') {
            if (typeof id.toString === 'function') {
              const str = id.toString();
              if (str && str !== '[object Object]') return str;
            }
            if (id._id) return normalizeId(id._id);
            if (id.id) return normalizeId(id.id);
            if (id.$oid) return String(id.$oid);
            if (id.oid) return String(id.oid);
          }
          return String(id);
        };

        const items = get().items;
        const itemIndex = items.findIndex(
          (item) =>
            normalizeId(item.product._id) === normalizeId(productId) &&
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



