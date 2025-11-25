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
  cleanup: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: async (productId: string) => {
        // Validate productId
        if (!productId || typeof productId !== 'string' || productId.trim() === '') {
          console.error('Invalid product ID:', productId);
          return;
        }
        
        const currentItems = get().items;
        console.log('Adding to wishlist:', { productId, currentItems, alreadyInList: currentItems.includes(productId) });
        
        if (!currentItems.includes(productId)) {
          // Update local state immediately
          const newItems = [...currentItems, productId];
          set({ items: newItems });
          console.log('Updated local wishlist:', newItems);
          
          // Sync with backend if user is authenticated
          const { isAuthenticated } = useAuthStore.getState();
          console.log('User authenticated:', isAuthenticated);
          
          if (isAuthenticated) {
            try {
              const result = await wishlistService.addToWishlist(productId);
              console.log('Backend wishlist update successful:', result);
            } catch (error: any) {
              // Revert on error
              set({ items: currentItems });
              console.error('Failed to add to wishlist backend:', error);
              console.error('Error details:', error.response?.data || error.message);
            }
          } else {
            console.log('User not authenticated, saved to local storage only');
          }
        } else {
          console.log('Product already in wishlist');
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
      
      // Clean up invalid items from wishlist
      cleanup: () => {
        const currentItems = get().items;
        const validItems = currentItems.filter((id) => id && typeof id === 'string' && id.trim() !== '');
        if (validItems.length !== currentItems.length) {
          set({ items: validItems });
        }
      },

      syncWithBackend: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        try {
          const wishlistProducts = await wishlistService.getWishlist();
          const productIds = wishlistProducts
            .map((product: any) => product._id || product.id)
            .filter((id: any) => id && typeof id === 'string' && id.trim() !== ''); // Filter out invalid IDs
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



