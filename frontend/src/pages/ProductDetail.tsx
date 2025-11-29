import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import { reviewService } from '@/services/reviews';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductCard from '@/components/ProductCard';
import { Heart, Star, ShoppingCart, Truck, RotateCcw, Shield, Sparkles } from 'lucide-react';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: product, isLoading, error: productError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProduct(slug!),
    enabled: !!slug,
    retry: 1
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?._id],
    queryFn: () => reviewService.getProductReviews(product!._id),
    enabled: !!product && !!product._id
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', slug],
    queryFn: () => productService.getRelatedProducts(slug!),
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (productError) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Error loading product</h1>
        <p className="text-gray-600 mb-4">There was an error loading this product. Please try again.</p>
        <button
          onClick={() => navigate('/products')}
          className="text-primary-600 hover:text-primary-700"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <button
          onClick={() => navigate('/products')}
          className="text-primary-600 hover:text-primary-700"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  // Convert _id to string if it's an object (MongoDB ObjectId)
  const productId = product._id ? String(product._id) : null;
  const inWishlist = productId ? isInWishlist(productId) : false;
  
  // Safety checks for variants and images
  const hasVariants = product?.variants && Array.isArray(product.variants) && product.variants.length > 0;
  const hasImages = product?.images && Array.isArray(product.images) && product.images.length > 0;
  
  // Ensure selectedVariant and selectedImage are within bounds
  const safeSelectedVariant = hasVariants 
    ? Math.max(0, Math.min(selectedVariant, product.variants.length - 1))
    : 0;
  const safeSelectedImage = hasImages 
    ? Math.max(0, Math.min(selectedImage, product.images.length - 1))
    : 0;
  
  const selectedVariantData = hasVariants ? product.variants[safeSelectedVariant] : undefined;
  const price = selectedVariantData?.price || product?.basePrice || 0;

  const handleAddToCart = () => {
    addToCart(product, selectedVariantData || undefined, quantity);
    // Show success message or redirect to cart
  };

  const handleWishlistToggle = async () => {
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
  };

  // Reset zoom and validate selectedImage when product or selectedImage changes
  useEffect(() => {
    if (!product) return;
    
    setZoomPosition(null);
    setImageLoaded(false);
    
    // Ensure selectedImage is within bounds
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      if (selectedImage >= product.images.length || selectedImage < 0) {
        setSelectedImage(0);
      }
    } else {
      setSelectedImage(0);
    }
    
    // Ensure selectedVariant is within bounds
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      if (selectedVariant >= product.variants.length || selectedVariant < 0) {
        setSelectedVariant(0);
      }
    } else {
      setSelectedVariant(0);
    }
  }, [selectedImage, selectedVariant, product]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2">
          <li><Link to="/" className="text-gray-600 hover:text-primary-600">Home</Link></li>
          <li>/</li>
          <li><Link to="/products" className="text-gray-600 hover:text-primary-600">Products</Link></li>
          <li>/</li>
          <li className="text-gray-900">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div 
            className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative group cursor-zoom-in"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              
              // Clamp values to prevent zoom from going out of bounds
              const clampedX = Math.max(0, Math.min(100, x));
              const clampedY = Math.max(0, Math.min(100, y));
              
              setZoomPosition({ x: clampedX, y: clampedY });
            }}
            onMouseLeave={() => setZoomPosition(null)}
          >
            <div className="relative w-full h-full overflow-hidden">
              {hasImages && product.images[safeSelectedImage] ? (
                <img
                  src={normalizeImageUrl(product.images[safeSelectedImage]) || ''}
                  alt={product?.name || 'Product image'}
                  onError={(e) => {
                    handleImageError(e, product?.name || 'Product');
                    setImageLoaded(false);
                  }}
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover transition-all duration-200 ease-out ${
                    zoomPosition ? 'scale-[2.5]' : 'scale-100'
                  }`}
                  style={{
                    transformOrigin: zoomPosition ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center center',
                    willChange: zoomPosition ? 'transform' : 'auto'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
              
              {/* Subtle overlay to indicate zoom area */}
              {zoomPosition && imageLoaded && (
                <div 
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background: `radial-gradient(circle 200px at ${zoomPosition.x}% ${zoomPosition.y}%, transparent 40%, rgba(0,0,0,0.05) 100%)`
                  }}
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images?.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                  selectedImage === index ? 'border-primary-600' : 'border-transparent'
                }`}
              >
                <img 
                  src={normalizeImageUrl(image)} 
                  alt={`${product.name} ${index + 1}`} 
                  onError={(e) => handleImageError(e, `${product.name} ${index + 1}`)}
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-lg font-medium">{product.averageRating.toFixed(1)}</span>
            <a href="#reviews" className="text-primary-600 hover:underline">
              ({product.totalReviews} reviews)
            </a>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">${price.toFixed(2)}</span>
              {product.compareAtPrice && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
            {product.autoshipEligible && product.autoshipDiscount && (
              <p className="text-green-600 mt-2">
                Save {product.autoshipDiscount}% with Autoship: ${(price * (1 - product.autoshipDiscount / 100)).toFixed(2)}
              </p>
            )}
          </div>

          {/* Variants */}
          {product.variants.length > 0 && selectedVariantData && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Size: {selectedVariantData.size || selectedVariantData.weight}
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedVariant(index)}
                    disabled={variant.stock === 0}
                    className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                      selectedVariant === index
                        ? 'border-primary-600 bg-primary-50'
                        : variant.stock === 0
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {variant.size || variant.weight}
                    <div className="text-sm">${variant.price.toFixed(2)}</div>
                    {variant.stock === 0 && (
                      <div className="text-xs text-red-500">Out of Stock</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Availability */}
          <div className="mb-6">
            {selectedVariantData ? (
              selectedVariantData.stock > 0 ? (
                <div className="flex items-center gap-2">
                  {selectedVariantData.stock <= 5 ? (
                    <>
                      <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                      <span className="text-orange-600 font-medium">
                        Only {selectedVariantData.stock} left in stock!
                      </span>
                    </>
                  ) : selectedVariantData.stock <= 10 ? (
                    <>
                      <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                      <span className="text-yellow-600 font-medium">
                        Low stock - {selectedVariantData.stock} available
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span className="text-green-600 font-medium">In Stock ({selectedVariantData.stock} available)</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="text-red-600 font-medium">Out of Stock</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-green-600 font-medium">In Stock</span>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariantData || (selectedVariantData ? selectedVariantData.stock === 0 : true)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                selectedVariantData && selectedVariantData.stock > 0
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={20} />
              {selectedVariantData && selectedVariantData.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`px-6 py-3 border-2 rounded-lg font-semibold transition-colors ${
                inWishlist
                  ? 'border-red-500 text-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Product Details */}
          <div className="border-t pt-6 space-y-4 mb-6">
            {/* Category & Pet Type */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.category && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {typeof product.category === 'string' ? product.category : product.category.name}
                </span>
              )}
              {product.petType && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {product.petType.charAt(0).toUpperCase() + product.petType.slice(1)}
                </span>
              )}
              {product.autoshipEligible && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Autoship Available
                </span>
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Product Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Truck className="text-primary-600" size={24} />
              <div>
                <p className="font-medium">Free Shipping</p>
                <p className="text-sm text-gray-600">On orders over $49</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="text-primary-600" size={24} />
              <div>
                <p className="font-medium">Easy Returns</p>
                <p className="text-sm text-gray-600">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="text-primary-600" size={24} />
              <div>
                <p className="font-medium">100% Secure</p>
                <p className="text-sm text-gray-600">Safe & secure checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <div className="border-b mb-6">
          <button className="px-6 py-3 border-b-2 border-primary-600 font-semibold">
            Description
          </button>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-700 mb-6">{product.description}</p>

          {product.features && product.features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Key Features</h3>
              <ul className="list-disc list-inside space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {product.ingredients && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Ingredients</h3>
              <p className="text-gray-700">{product.ingredients}</p>
            </div>
          )}

          {/* Autoship Details */}
          {product.autoshipEligible && product.autoshipDiscount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-900">Autoship & Save</h3>
              <div className="space-y-2">
                <p className="text-green-800">
                  <span className="font-bold text-2xl">{product.autoshipDiscount}% OFF</span> with Autoship
                </p>
                <p className="text-green-700">
                  First Autoship Price: <span className="font-bold">${(price * (1 - product.autoshipDiscount / 100)).toFixed(2)}</span>
                </p>
                {product.autoshipFrequency && (
                  <p className="text-sm text-green-600">
                    Delivered every {product.autoshipFrequency} days (you can adjust frequency)
                  </p>
                )}
                <ul className="list-disc list-inside text-sm text-green-700 mt-3 space-y-1">
                  <li>Save on every order</li>
                  <li>Free shipping on all Autoship orders</li>
                  <li>Skip, pause, or cancel anytime</li>
                  <li>Manage deliveries from your account</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="mt-12 bg-gray-50 rounded-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Customer Reviews</h2>
          {reviews && reviews.data.length > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-4xl font-bold">{product.averageRating.toFixed(1)}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">{product.totalReviews} {product.totalReviews === 1 ? 'review' : 'reviews'}</p>
            </div>
          )}
        </div>

        {reviews && reviews.data.length > 0 ? (
          <div className="space-y-6">
            {reviews.data.map((review) => (
              <div key={review._id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      {review.verifiedPurchase && (
                        <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                    {review.title && (
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{review.title}</h4>
                    )}
                  </div>
                </div>

                {/* Review Author & Date */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    {review.user.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.user.firstName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}

            {/* Show More Reviews Link */}
            {reviews.data.length >= 5 && (
              <div className="text-center pt-4">
                <button className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                  View All {product.totalReviews} Reviews
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="text-gray-400 mb-3">
              <Star size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">No reviews yet</p>
            <p className="text-gray-500">Be the first to review this product!</p>
          </div>
        )}
      </div>

      {/* Suggested Products Section */}
      {relatedProducts && relatedProducts.data && relatedProducts.data.length > 0 && (
        <div className="mt-16 border-t pt-12">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles size={28} className="text-primary-600" />
            <h2 className="text-3xl font-bold">You May Also Like</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Similar products based on category and pet type
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {relatedProducts.data.map((relatedProduct) => (
              <div key={relatedProduct._id} className="flex">
                <ProductCard product={relatedProduct} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;



