import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { X, Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, Sparkles } from 'lucide-react';
import { normalizeImageUrl } from '@/utils/imageUtils';
import { generateProductUrl } from '@/utils/productUrl';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface QuickViewModalProps {
  productSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal = ({ productSlug, isOpen, onClose }: QuickViewModalProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { toast, showToast, hideToast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productSlug],
    queryFn: () => productService.getProduct(productSlug),
    enabled: isOpen && !!productSlug,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    if (!product) return;
    
    const variant = product.variants && product.variants.length > 0 
      ? product.variants[selectedVariant] 
      : undefined;
    
    addToCart({
      product: product._id,
      name: product.name,
      price: variant?.price || product.price,
      image: product.images?.[0] || '',
      quantity,
      variant: variant ? {
        sku: variant.sku,
        size: variant.size,
        weight: variant.weight,
        attributes: variant.attributes
      } : undefined
    });
    
    showToast('Product added to cart!', 'success');
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
      showToast('Removed from wishlist', 'success');
    } else {
      addToWishlist(product._id);
      showToast('Added to wishlist!', 'success');
    }
  };

  const handleViewFullDetails = () => {
    onClose();
    navigate(generateProductUrl(product!));
  };

  return (
    <>
      <Toast toast={toast} onClose={hideToast} />
      
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : product ? (
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Left: Images */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={normalizeImageUrl(product.images?.[selectedImage] || '', { width: 600, height: 600 })}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.slice(0, 4).map((image, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === idx ? 'border-primary-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={normalizeImageUrl(image, { width: 150, height: 150 })}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-primary-600 font-semibold uppercase mb-1">{product.brand}</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                  
                  {/* Rating */}
                  {product.averageRating > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ${product.variants && product.variants.length > 0 && product.variants[selectedVariant]
                        ? product.variants[selectedVariant].price.toFixed(2)
                        : product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="ml-2 text-lg text-gray-500 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Variant:</label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariant(idx)}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            selectedVariant === idx
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {variant.size || variant.weight || `Variant ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity:</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Stock Status */}
                {product.totalStock > 0 ? (
                  <p className="text-green-600 font-medium">✓ In Stock</p>
                ) : (
                  <p className="text-red-600 font-medium">✗ Out of Stock</p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.totalStock === 0}
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingCart size={20} />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    className={`px-4 py-3 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      isInWishlist(product._id)
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Heart size={20} className={isInWishlist(product._id) ? 'fill-current' : ''} />
                  </button>
                </div>

                <button
                  onClick={handleViewFullDetails}
                  className="w-full text-primary-600 hover:text-primary-700 font-semibold py-2 hover:underline"
                >
                  View Full Product Details →
                </button>

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Key Features:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {product.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600">Product not found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuickViewModal;

