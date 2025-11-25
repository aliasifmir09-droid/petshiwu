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

      addToWishlist: async (productId: string | any) => {
        // Convert productId to string
        const productIdStr = productId ? String(productId) : null;
        
        // Validate productId
        if (!productIdStr || productIdStr.trim() === '') {
          console.error('Invalid product ID:', productId);
          return;
        }
        
        const currentItems = get().items;
        // Convert all items to strings for comparison
        const currentItemsStr = currentItems.map(item => String(item));
        const alreadyInList = currentItemsStr.includes(productIdStr);
        
        console.log('Adding to wishlist:', { productId: productIdStr, currentItems: currentItemsStr, alreadyInList });
        
        if (!alreadyInList) {
          // Update local state immediately (store as string)
          const newItems = [...currentItemsStr, productIdStr];
          set({ items: newItems });
          console.log('Updated local wishlist:', newItems);
          
          // Sync with backend if user is authenticated
          const { isAuthenticated } = useAuthStore.getState();
          console.log('User authenticated:', isAuthenticated);
          
          if (isAuthenticated) {
            try {
              const result = await wishlistService.addToWishlist(productIdStr);
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

      removeFromWishlist: async (productId: string | any) => {
        // Convert productId to string
        const productIdStr = productId ? String(productId) : null;
        if (!productIdStr) {
          console.error('Invalid product ID for removal:', productId);
          return;
        }
        
        const currentItems = get().items;
        // Convert all items to strings and filter
        const newItems = currentItems
          .map(item => String(item))
          .filter((id) => id !== productIdStr);
        
        // Update local state immediately
        set({ items: newItems });
        console.log('Removed from wishlist:', { productId: productIdStr, remainingItems: newItems });
        
        // Sync with backend if user is authenticated
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          try {
            await wishlistService.removeFromWishlist(productIdStr);
            console.log('Backend wishlist removal successful');
          } catch (error) {
            // Revert on error
            set({ items: currentItems });
            console.error('Failed to remove from wishlist backend:', error);
          }
        }
      },

      isInWishlist: (productId: string | any) => {
        // Convert productId to string for comparison
        const productIdStr = productId ? String(productId) : null;
        if (!productIdStr) return false;
        
        const items = get().items;
        // Convert all items to strings for comparison
        return items.some(item => String(item) === productIdStr);
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
          // Convert all product IDs to strings
          const productIds = wishlistProducts
            .map((product: any) => {
              const id = product._id || product.id;
              return id ? String(id) : null;
            })
            .filter((id: any): id is string => id && typeof id === 'string' && id.trim() !== ''); // Filter out invalid IDs
          set({ items: productIds });
          console.log('Synced wishlist from backend:', productIds);
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



