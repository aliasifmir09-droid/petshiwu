import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { wishlistService } from '@/services/wishlist';
import { productService } from '@/services/products';

const Favorites = () => {
  const { isAuthenticated } = useAuthStore();
  const { items, removeFromWishlist, cleanup } = useWishlistStore();
  
  // Clean up invalid items on mount
  useEffect(() => {
    cleanup();
  }, [cleanup]);

  // Fetch wishlist products
  const { data: wishlistProducts, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ['wishlist-products', items, isAuthenticated],
    queryFn: async () => {
      if (isAuthenticated) {
        // Get from backend
        try {
          const products = await wishlistService.getWishlist();
          // Ensure all products have _id as string
          const normalizedProducts = (products || []).map((product: any) => ({
            ...product,
            _id: product._id ? String(product._id) : product._id
          }));
          return normalizedProducts;
        } catch (error: any) {
          console.error('Failed to fetch wishlist from backend:', error);
          // If 404 or other error, fallback to local storage
          if (items.length === 0) return [];
          try {
            // Filter out null, undefined, or invalid IDs and convert to strings
            const validItems = items
              .map(id => String(id))
              .filter((id) => id && id.trim() !== '');
            if (validItems.length === 0) return [];
            
            const products = await Promise.all(
              validItems.map((id) => productService.getProduct(id).catch(() => null))
            );
            const validProducts = products.filter((p) => p !== null);
            // Normalize _id to strings
            return validProducts.map((product: any) => ({
              ...product,
              _id: product._id ? String(product._id) : product._id
            }));
          } catch {
            return [];
          }
        }
      } else {
        // Get from local storage (for guest users)
        if (items.length === 0) return [];
        try {
          // Filter out null, undefined, or invalid IDs and convert to strings
          const validItems = items
            .map(id => String(id))
            .filter((id) => id && id.trim() !== '');
          if (validItems.length === 0) return [];
          
          const products = await Promise.all(
            validItems.map((id) => productService.getProduct(id).catch(() => null))
          );
          const validProducts = products.filter((p) => p !== null);
          // Normalize _id to strings
          return validProducts.map((product: any) => ({
            ...product,
            _id: product._id ? String(product._id) : product._id
          }));
        } catch {
          return [];
        }
      }
    },
    enabled: true, // Always enabled so we can show empty state
    retry: 1,
    retryOnMount: false
  });

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      refetch();
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle errors gracefully
  if (queryError) {
    console.error('Error loading favorites:', queryError);
  }

  const products = wishlistProducts || [];
  const isEmpty = products.length === 0;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Heart className="text-red-600" size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Favorites</h1>
            <p className="text-gray-600 mt-1">
              {isEmpty ? 'No favorite products yet' : `${products.length} favorite product${products.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="text-gray-400" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Favorites Yet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start adding products to your favorites by clicking the heart icon on any product.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            <ShoppingCart size={20} />
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => {
              const productId = product._id ? String(product._id) : (product.id ? String(product.id) : null);
              if (!productId) return null;
              return (
              <div key={productId} className="relative group">
                <ProductCard product={product} />
                {/* Remove Button Overlay */}
                <button
                  onClick={() => handleRemoveFromWishlist(productId)}
                  className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10"
                  aria-label="Remove from favorites"
                >
                  <Trash2 className="text-red-600" size={18} />
                </button>
              </div>
            );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <ShoppingCart size={20} />
              Continue Shopping
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Favorites;

