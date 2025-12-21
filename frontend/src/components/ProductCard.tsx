import { Link } from 'react-router-dom';
import { generateProductUrl } from '@/utils/productUrl';
import { Heart, Star, ShoppingCart, TrendingUp, Clock } from 'lucide-react';
import { Product } from '@/types';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { memo, useCallback, useMemo, useState } from 'react';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import { useImageLoadTracker } from '@/hooks/useImageLoadTracker';

interface ProductCardProps {
  product: Product;
  hideCartButton?: boolean;
  index?: number;
  priority?: boolean;
}

const ProductCard = memo(({ product, hideCartButton = false, index, priority = false }: ProductCardProps) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const { markImageFailed } = useImageLoadTracker();
  // Convert _id to string if it's an object (MongoDB ObjectId)
  const productId = product._id ? String(product._id) : null;
  const inWishlist = productId ? isInWishlist(productId) : false;
  const [isHovered, setIsHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  
  // Memoize mouse handlers
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  
  // Memoize star indices
  const starIndices = useMemo(() => Array.from({ length: 5 }, (_, i) => i), []);
  
  // Determine loading priority (first 4 products or explicit priority)
  const shouldLoadEager = priority || (index !== undefined && index < 4);
  
  // Hide product if image has failed to load
  if (imageFailed) {
    return null;
  }

  const handleWishlistToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId) {
      return;
    }
    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      // Silent fail
    }
  }, [inWishlist, productId, addToWishlist, removeFromWishlist]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, product.variants[0]);
  }, [product, addToCart]);

  const discountPercent = useMemo(() => product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
    : 0, [product.compareAtPrice, product.basePrice]);

  // Calculate urgency level based on stock
  const urgencyLevel = useMemo(() => {
    if (!product.inStock) return 'out';
    if (product.totalStock <= 3) return 'critical';
    if (product.totalStock <= 5) return 'high';
    if (product.totalStock <= 10) return 'medium';
    return 'low';
  }, [product.inStock, product.totalStock]);


  return (
    <Link
      to={generateProductUrl(product)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-300 hover:-translate-y-2 relative animate-fade-in-up hover-lift flex flex-col h-full w-full"
    >
      {/* Trending Badge - Top Right Corner */}
      {product.totalReviews > 50 && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1 animate-pulse-slow">
            <TrendingUp size={12} />
            <span>TRENDING</span>
          </div>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={normalizeImageUrl(product.images?.[0])}
          alt={product.name}
          width={400}
          height={400}
          loading={shouldLoadEager ? "eager" : "lazy"}
          {...(shouldLoadEager ? { fetchpriority: "high" as any } : { fetchpriority: "auto" as any })}
          onError={(e) => {
            handleImageError(e, product.name);
            // Mark this product's image as failed - will hide the product
            if (productId) {
              markImageFailed(productId);
              setImageFailed(true);
            }
            // Suppress console errors for failed image loads (403, 404, etc.)
            e.stopPropagation();
          }}
          className="w-full h-full object-cover aspect-square group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {discountPercent > 0 && (
            <span className="bg-gradient-to-r from-red-500 via-red-600 to-orange-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-xl animate-pulse-slow backdrop-blur-sm">
              🔥 SAVE {discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
              ⭐ Featured
            </span>
          )}
        </div>


        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-3.5 rounded-full bg-white/95 backdrop-blur-md shadow-xl hover:scale-125 transition-all duration-300 transform min-w-[44px] min-h-[44px] flex items-center justify-center ${
            inWishlist ? 'text-red-500 ring-2 ring-red-300 animate-wiggle' : 'text-gray-400 hover:text-red-500'
          }`}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={2.5} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="space-y-3 flex-grow">
          {/* Brand */}
          <p className="text-xs text-blue-600 font-extrabold uppercase tracking-widest mb-1 group-hover:text-blue-700 transition-colors">
            {product.brand}
          </p>

          {/* Name */}
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-3 min-h-[4rem] text-sm group-hover:text-blue-700 transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Rating - Only render if there are reviews */}
          {product.totalReviews > 0 ? (
            <div className="space-y-1.5 min-h-[24px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center">
                    {starIndices.map((i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={`${
                          i < Math.floor(product.averageRating) 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-800">{product.averageRating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-500">({product.totalReviews} reviews)</span>
              </div>
            </div>
          ) : (
            <div className="min-h-[24px]"></div>
          )}

          {/* Price Section with Enhanced Design */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                ${product.basePrice.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-green-600 font-bold">
                    YOU SAVE ${(product.compareAtPrice - product.basePrice).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Urgency Indicator with Animations */}
          <div className="mb-2 min-h-[2rem]">
            {urgencyLevel === 'critical' && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-2.5 animate-pulse-slow">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-red-600 animate-wiggle" />
                  <div className="flex-1">
                    <p className="text-xs font-black text-red-700 uppercase">
                      ⚡ ALMOST GONE!
                    </p>
                    <p className="text-xs text-red-600 font-bold">
                      Only {product.totalStock} left in stock
                    </p>
                  </div>
                </div>
              </div>
            )}
            {urgencyLevel === 'high' && (
              <div className="bg-orange-50 border border-orange-300 rounded-lg p-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-orange-700 font-bold">
                  Hurry! Only {product.totalStock} left
                </span>
              </div>
            )}
            {urgencyLevel === 'medium' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-xs text-yellow-700 font-semibold">
                  Low stock - {product.totalStock} remaining
                </span>
              </div>
            )}
            {urgencyLevel === 'low' && product.inStock && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-700 font-semibold">In Stock & Ready to Ship</span>
              </div>
            )}
            {urgencyLevel === 'out' && (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-xs text-red-600 font-bold">Currently Unavailable</span>
              </div>
            )}
          </div>
        </div>

        {/* Add to Cart Button with Enhanced Design - Always at bottom */}
        {!hideCartButton && (
          <div className="mt-auto pt-3">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              aria-label={product.inStock ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 btn-ripple relative overflow-hidden ${
                product.inStock
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-2xl hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={20} strokeWidth={2.5} />
              <span className="relative z-10">
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </span>
              {product.inStock && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              )}
            </button>
          </div>
        )}

        {/* Quick View Hint (appears on hover) */}
        {isHovered && product.inStock && (
          <p className="text-center text-xs text-gray-500 animate-fade-in-up font-medium">
            Click to view details
          </p>
        )}
      </div>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;



