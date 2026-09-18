import { Link } from 'react-router-dom';
import { generateProductUrl } from '@/utils/productUrl';
import { Heart, Star, ShoppingCart, TrendingUp, Eye } from 'lucide-react';
import { Product } from '@/types';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { memo, useCallback, useMemo, useState } from 'react';
import { normalizeImageUrl, handleImageError, generateSrcSet, getOptimalImageSize } from '@/utils/imageUtils';
import { useImageLoadTracker } from '@/hooks/useImageLoadTracker';
import { usePrefetch } from '@/hooks/usePrefetch';
import { preloadProductImages } from '@/utils/imagePreloader';
import { highlightSearchTerm } from '@/utils/searchHighlight';
import QuickViewModal from './QuickViewModal';
import { decodeHtmlEntities } from '@/utils/htmlUtils';
import { getListingPrice, getListingVariant, getProductImage, getValidCompareAtPrice } from '@/utils/productPrice';
import { addToCartLabel, inStockLabel } from '@/config/ordering';
import { FIRST_ORDER_CARD_LINE, REPEAT_ORDER_CARD_LINE } from '@/config/publicPromos';

interface ProductCardProps {
  product: Product;
  hideCartButton?: boolean;
  index?: number;
  priority?: boolean;
  searchTerm?: string;
  recommendationType?: 'frequently-bought-together' | 'customers-also-bought' | 'you-may-also-like' | 'similar-products' | 'trending' | 'personalized';
  sourceProductId?: string;
  onRecommendationClick?: (productId: string, recommendationType: string, position: number) => void;
}

const ProductCard = memo(({ product, hideCartButton = false, index, priority = false, searchTerm, recommendationType, sourceProductId, onRecommendationClick }: ProductCardProps) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const [cartAdded, setCartAdded] = useState(false);
  const { markImageFailed } = useImageLoadTracker();
  const { prefetchProduct } = usePrefetch();
  
  // Convert _id to string if it's an object (MongoDB ObjectId)
  const productId = product._id ? String(product._id) : null;
  const inWishlist = productId ? isInWishlist(productId) : false;
  const [showQuickView, setShowQuickView] = useState(false);

  // Handle click on product card - track recommendation clicks if applicable
  const handleClick = useCallback(() => {
    if (onRecommendationClick && recommendationType && productId && sourceProductId) {
      const position = index !== undefined ? index : 0;
      onRecommendationClick(productId, recommendationType, position);
    }
  }, [onRecommendationClick, recommendationType, productId, sourceProductId, index]);
  
  // Memoize mouse handlers with prefetching
  const handleMouseEnter = useCallback(() => {
    if (product.slug) {
      prefetchProduct(product.slug);
      // Preload product images
      if (product.images && product.images.length > 0) {
        preloadProductImages(product.images).catch(() => {
          // Silently fail - prefetching is optional
        });
      }
    }
  }, [product.slug, product.images, prefetchProduct]);
  
  // Memoize star indices
  const starIndices = useMemo(() => Array.from({ length: 5 }, (_, i) => i), []);
  
  // Determine loading priority (first 4 products or explicit priority)
  const shouldLoadEager = priority || (index !== undefined && index < 4);
  
  // Show placeholder when image fails (403, 404, etc.) instead of hiding product

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

  const listingVariant = useMemo(() => getListingVariant(product), [product]);
  const listingPrice = useMemo(() => getListingPrice(product), [product]);
  const compareAtPrice = useMemo(
    () => getValidCompareAtPrice(listingPrice, listingVariant?.compareAtPrice ?? product.compareAtPrice),
    [listingPrice, listingVariant?.compareAtPrice, product.compareAtPrice]
  );

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = addToCart(product, listingVariant);
    if (!added) return;
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2500);
  }, [product, listingVariant, addToCart]);

  const discountPercent = useMemo(() => compareAtPrice
    ? Math.round(((compareAtPrice - listingPrice) / compareAtPrice) * 100)
    : 0, [compareAtPrice, listingPrice]);

  const isReadyToShip = product.inStock;


  return (
    <Link
      to={generateProductUrl(product)}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-stone-200 hover:border-stone-300 relative flex flex-col h-full w-full"
    >
      {/* Trending Badge - Top Right Corner */}
      {product.totalReviews > 50 && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-[#1E3A8A] text-white text-[10px] font-semibold px-2.5 py-1 rounded-bl-lg flex items-center gap-1">
            <TrendingUp size={12} />
            <span>Popular</span>
          </div>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={normalizeImageUrl(getProductImage(product), { 
            size: getOptimalImageSize(254, 254),
            format: 'auto'
          })}
          srcSet={generateSrcSet(getProductImage(product), [254, 400, 600])}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 254px"
          alt={product.name}
          width={254}
          height={254}
          loading={shouldLoadEager ? "eager" : "lazy"}
          {...(shouldLoadEager ? { fetchpriority: "high" as any } : { fetchpriority: "auto" as any })}
          onError={(e) => {
            handleImageError(e, product.name);
            // Show placeholder instead of hiding - mark as failed for load tracking
            if (productId) markImageFailed(productId);
            // Suppress console errors for failed image loads (403, 404, etc.)
            e.stopPropagation();
          }}
          className="w-full h-full object-cover aspect-square"
        />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {discountPercent > 0 && (
            <span className="bg-[#1E3A8A] text-white text-xs font-semibold px-2.5 py-1 rounded">
              {discountPercent}% off
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-white text-[#1E3A8A] text-xs font-semibold px-2.5 py-1 rounded border border-slate-200">
              Featured
            </span>
          )}
        </div>


        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-3.5 rounded-full bg-white/95 shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center z-20 ${
            inWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
          }`}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={2.5} />
        </button>

        {/* Quick View Button - Appears on Hover */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowQuickView(true);
          }}
          className="absolute bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/95 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-2 text-sm font-semibold text-gray-700"
          aria-label="Quick view"
        >
          <Eye size={16} />
          <span>Quick View</span>
        </button>
      </div>

      <div className="px-3.5 pt-3 pb-3.5 flex flex-col flex-grow">
        <div className="flex-grow">
          {product.brand ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1">
              {decodeHtmlEntities(product.brand)}
            </p>
          ) : null}

          <h3 className="font-semibold text-stone-900 line-clamp-2 min-h-[2.5rem] text-sm leading-snug group-hover:text-[#1E3A8A]">
            {searchTerm ? highlightSearchTerm(decodeHtmlEntities(product.name), searchTerm) : decodeHtmlEntities(product.name)}
          </h3>

          <div className="mt-1.5 flex items-center gap-1.5 min-h-[1.25rem]">
            <div className="flex items-center">
              {starIndices.map((i) => (
                <Star
                  key={i}
                  size={13}
                  className={
                    product.totalReviews > 0 && i < Math.round(Number(product.averageRating) || 0)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-stone-200'
                  }
                />
              ))}
            </div>
            {product.totalReviews > 0 ? (
              <>
                <span className="text-xs font-semibold text-stone-800">
                  {Number(product.averageRating || 0).toFixed(1)}
                </span>
                <span className="text-xs text-stone-500">({product.totalReviews})</span>
              </>
            ) : (
              <span className="text-xs text-stone-400">New</span>
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-stone-900 tracking-tight">
              ${listingPrice.toFixed(2)}
            </span>
            {compareAtPrice ? (
              <span className="text-sm text-stone-400 line-through">${compareAtPrice.toFixed(2)}</span>
            ) : null}
          </div>

          <p className="mt-2 text-xs font-semibold text-emerald-700">{FIRST_ORDER_CARD_LINE}</p>
          <p className="text-[11px] font-medium text-stone-500">{REPEAT_ORDER_CARD_LINE}</p>

          <div className="mt-2 min-h-[1.25rem]">
            {isReadyToShip ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-xs text-stone-500">{inStockLabel(true)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                <span className="text-xs font-semibold text-red-600">Out of stock</span>
              </div>
            )}
          </div>
        </div>

        {!hideCartButton && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              aria-label={product.inStock ? `${addToCartLabel(true)} ${product.name}` : `${product.name} is out of stock`}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-extrabold text-sm ${
                cartAdded
                  ? 'bg-emerald-600 text-white'
                  : product.inStock
                  ? 'bg-[#F59E0B] text-[#1E3A8A] hover:bg-[#D97706] hover:text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {cartAdded ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={18} strokeWidth={2.5} />
                  <span>{addToCartLabel(Boolean(product.inStock))}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {product.slug && (
        <QuickViewModal
          productSlug={product.slug}
          isOpen={showQuickView}
          onClose={() => setShowQuickView(false)}
        />
      )}
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;



