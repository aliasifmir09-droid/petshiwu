import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistService } from '@/services/wishlist';
import { useAuthStore } from './authStore';

interface WishlistState {
  items: string[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  syncWithBackend: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: async (productId: string) => {
        const currentItems = get().items;
        if (!currentItems.includes(productId)) {
          // Update local state immediately
          set({ items: [...currentItems, productId] });
          
          // Sync with backend if user is authenticated
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            try {
              await wishlistService.addToWishlist(productId);
            } catch (error) {
              // Revert on error
              set({ items: currentItems });
              console.error('Failed to add to wishlist:', error);
            }
          }
        }
      },

      removeFromWishlist: async (productId: string) => {
        const currentItems = get().items;
        const newItems = currentItems.filter((id) => id !== productId);
        
        // Update local state immediately
        set({ items: newItems });
        
        // Sync with backend if user is authenticated
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          try {
            await wishlistService.removeFromWishlist(productId);
          } catch (error) {
            // Revert on error
            set({ items: currentItems });
            console.error('Failed to remove from wishlist:', error);
          }
        }
      },

      isInWishlist: (productId: string) => {
        return get().items.includes(productId);
      },

      clearWishlist: () => set({ items: [] }),

      syncWithBackend: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        try {
          const wishlistProducts = await wishlistService.getWishlist();
          const productIds = wishlistProducts.map((product: any) => product._id || product.id);
          set({ items: productIds });
        } catch (error) {
          console.error('Failed to sync wishlist:', error);
        }
      }
    }),
    {
      name: 'wishlist-storage'
    }
  )
);



