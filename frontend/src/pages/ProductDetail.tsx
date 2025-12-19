import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { productService } from '@/services/products';
import { reviewService } from '@/services/reviews';
import { recommendationService } from '@/services/recommendations';
import { socialService } from '@/services/social';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import { Heart, Star, ShoppingCart, Truck, RotateCcw, Shield, Sparkles, ChevronRight, Home, Share2, Facebook, Twitter, Mail, Copy, Check } from 'lucide-react';
import { FormattedDescription } from '@/utils/descriptionFormatter';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import { generateProductUrl } from '@/utils/productUrl';
import { FREE_SHIPPING_THRESHOLD } from '@/config/constants';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { trackProductView, trackAddToWishlist, trackProductComparison, trackShare } from '@/utils/analytics';
import { addToRecentlyViewed } from '@/utils/recentlyViewed';
import SEO from '@/components/SEO';

const ProductDetail = () => {
  const { slug, petType } = useParams<{ 
    slug?: string; 
    petType?: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Extract product slug from URL - supports both old and new formats
  // Old format: /products/product-slug
  // New format: /petType/categoryPath/product-slug
  let actualProductSlug = slug || '';
  
  // If no slug param, try to extract from pathname (new SEO-friendly format)
  // For route /:petType/*, the splat (*) captures everything after petType
  // Since specific routes are ordered before this catch-all, we can safely extract the slug
  if (!actualProductSlug && petType) {
    const pathname = location.pathname; // BrowserRouter - no hash to remove
    const parts = pathname.split('/').filter(Boolean);
    
    // If path starts with petType, extract product slug (last part)
    // This route only matches if no specific route matched, so we can safely extract
    if (parts.length > 0 && parts[0] === petType) {
      // Last part is always the product slug
      actualProductSlug = parts[parts.length - 1] || '';
    }
  }
  
  const { addToCart } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: product, isLoading, error: productError } = useQuery({
    queryKey: ['product', actualProductSlug],
    queryFn: () => productService.getProduct(actualProductSlug),
    enabled: !!actualProductSlug,
    retry: 1,
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 10 * 60 * 1000 // Cache for 10 minutes
  });

  const [reviewSort] = useState('newest');
  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?._id, reviewSort],
    queryFn: () => reviewService.getProductReviews(product!._id, 1, 10, undefined, reviewSort),
    enabled: !!product && !!product._id,
    staleTime: 1 * 60 * 1000, // Consider fresh for 1 minute
    gcTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', actualProductSlug],
    queryFn: () => productService.getRelatedProducts(actualProductSlug),
    enabled: !!actualProductSlug,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 15 * 60 * 1000 // Cache for 15 minutes
  });

  // Get all recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', product?._id],
    queryFn: () => recommendationService.getRecommendations(String(product?._id), 8),
    enabled: !!product?._id,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 15 * 60 * 1000 // Cache for 15 minutes
  });

  // Get "Frequently Bought Together" separately
  const { data: frequentlyBoughtTogether } = useQuery({
    queryKey: ['frequently-bought-together', product?._id],
    queryFn: () => recommendationService.getFrequentlyBoughtTogether(String(product?._id), 4),
    enabled: !!product?._id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // Get "Customers Also Bought" separately
  const { data: customersAlsoBought } = useQuery({
    queryKey: ['customers-also-bought', product?._id],
    queryFn: () => recommendationService.getCustomersAlsoBought(String(product?._id), 8),
    enabled: !!product?._id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const { data: socialLinks } = useQuery({
    queryKey: ['social-links', product?._id],
    queryFn: () => socialService.getProductShareLinks(String(product?._id)),
    enabled: !!product?._id
  });

  const { toast, showToast, hideToast } = useToast();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = async (platform: string) => {
    if (!socialLinks) {
      showToast('Share links not available. Please try again.', 'error');
      return;
    }
    
    const url = socialLinks[platform as keyof typeof socialLinks];
    
    if (!url) {
      console.error('Share URL not found for platform:', platform, 'Available links:', socialLinks);
      showToast('Share link not available for this platform.', 'error');
      return;
    }
    
    const shareMethod = platform === 'copyLink' ? 'copy' : platform as 'facebook' | 'twitter' | 'email';
    
    if (platform === 'copyLink') {
      try {
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        showToast('Link copied to clipboard!', 'success');
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showToast('Failed to copy link. Please try again.', 'error');
      }
    } else {
      // Open share window for social platforms
      try {
        window.open(url, '_blank', 'width=600,height=400,menubar=no,toolbar=no,resizable=yes,scrollbars=yes');
      } catch (error) {
        console.error('Failed to open share window:', error);
        showToast('Failed to open share window. Please try again.', 'error');
      }
    }
    setShowShareMenu(false);
    
    // Track share
    if (product?._id) {
      trackShare(shareMethod, 'product', String(product._id));
    }
  };

  const handleCompare = () => {
    if (!product?._id) return;
    const productId = String(product._id);
    
    // Navigate to compare page with this product
    // The compare page will show search/suggestions for the second product
    navigate(`/compare?ids=${productId}`);
    
    // Track product comparison
    trackProductComparison([productId]);
  };

  // Reset zoom when image changes
  useEffect(() => {
    setZoomPosition(null);
    setImageLoaded(false);
  }, [selectedImage]);

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  // Reset indices when product changes
  useEffect(() => {
    if (!product?._id) {
      setSelectedImage(0);
      setSelectedVariant(0);
      return;
    }
    
    setSelectedImage(0);
    setSelectedVariant(0);
    
    // Track product view
    const categoryName = typeof product.category === 'object' && product.category?.name 
      ? product.category.name 
      : undefined;
    trackProductView(String(product._id), product.name, categoryName);
    
    // Add to recently viewed
    addToRecentlyViewed({
      _id: String(product._id),
      slug: product.slug,
      name: product.name,
      images: product.images
    });
  }, [product?._id]); // Reset to first image/variant when product changes

  // Redirect from old URL format (/products/slug) to new SEO-friendly format
  useEffect(() => {
    if (product && slug) {
      // If we're on the old URL format (/products/slug), redirect to new format
      const newUrl = generateProductUrl(product);
      const currentPath = location.pathname; // BrowserRouter - no hash to remove
      
      // Only redirect if the new URL is different and we're on the old format
      if (newUrl !== currentPath && currentPath.startsWith('/products/')) {
        navigate(newUrl, { replace: true });
      }
    }
  }, [product, slug, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <LoadingSpinner size="lg" ariaLabel="Loading product details" />
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
  
  // Safety checks for variants
  const hasVariants = product?.variants && Array.isArray(product.variants) && product.variants.length > 0;
  
  // Ensure selectedVariant is within bounds
  const safeSelectedVariant = hasVariants 
    ? Math.max(0, Math.min(selectedVariant, product.variants.length - 1))
    : 0;
  
  const selectedVariantData = hasVariants ? product.variants[safeSelectedVariant] : undefined;
  const price = selectedVariantData?.price || product?.basePrice || 0;

  // Determine which images to display: variant image if available, otherwise product images
  const displayImages = (() => {
    if (selectedVariantData?.image) {
      // Variant has a primary image - use it as the main image
      return [selectedVariantData.image];
    } else if (selectedVariantData?.images && selectedVariantData.images.length > 0) {
      // Variant has image gallery - use it
      return selectedVariantData.images;
    } else {
      // No variant images - fallback to product images
      return product.images || [];
    }
  })();

  const hasDisplayImages = displayImages.length > 0;
  const safeSelectedImage = hasDisplayImages 
    ? Math.max(0, Math.min(selectedImage, displayImages.length - 1))
    : 0;

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
        // Track add to wishlist
        trackAddToWishlist(productId, product.name);
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Build breadcrumbs
  const buildBreadcrumbs = () => {
    const crumbs = [
      { label: 'Home', path: '/' }
    ];

    // Add pet type if available (handle "other-animals" specially)
    if (product.petType) {
      const petTypeDisplay = product.petType === 'other-animals' 
        ? 'Other Animals' 
        : product.petType.charAt(0).toUpperCase() + product.petType.slice(1);
      
      // For "other-animals", we don't add it as a separate breadcrumb
      // For dog and cat, we add it
      if (product.petType !== 'other-animals') {
        crumbs.push({
          label: petTypeDisplay,
          path: `/${product.petType}`
        });
      }
    }

    // Add category hierarchy if category exists
    // Recursively build the full category chain (up to 3 levels: Supplies -> Toys -> Plush Toys)
    if (product.category && typeof product.category === 'object') {
      const categoryChain: Array<{ name: string; slug: string }> = [];
      
      // Traverse up the parent category chain and collect all categories
      let currentCategory: any = product.category;
      
      // First, collect all ancestors by traversing up the parent chain
      const ancestors: Array<{ name: string; slug: string }> = [];
      let parent = currentCategory.parentCategory;
      
      while (parent && typeof parent === 'object') {
        ancestors.push({
          name: parent.name,
          slug: parent.slug
        });
        // Check if parent has a parent (grandparent)
        parent = parent.parentCategory;
      }
      
      // Reverse ancestors to get top-to-bottom order (Supplies -> Toys)
      ancestors.reverse();
      
      // Add ancestors to chain
      categoryChain.push(...ancestors);
      
      // Add current category (Plush Toys)
      categoryChain.push({
        name: currentCategory.name,
        slug: currentCategory.slug
      });
      
      // Add all categories in the chain to breadcrumbs (in order: Supplies -> Toys -> Plush Toys)
      categoryChain.forEach((cat) => {
        const categoryPath = `/category/${cat.slug}`;
        const categoryPathWithPetType = product.petType && product.petType !== 'other-animals'
          ? `${categoryPath}?petType=${product.petType}`
          : categoryPath;
        
        crumbs.push({
          label: cat.name,
          path: categoryPathWithPetType
        });
      });
    }

    // Add product name (not clickable, it's the current page)
    crumbs.push({
      label: product.name,
      path: ''
    });

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  // Build SEO data
  const productTitle = product.name.length > 50 
    ? `${product.name.substring(0, 47)}... | petshiwu`
    : `${product.name} | petshiwu`;
  
  // Create description from product description or fallback
  const productDescription = product.description 
    ? DOMPurify.sanitize(product.description, { ALLOWED_TAGS: [] }).substring(0, 150).trim() + (product.description.length > 150 ? '...' : '')
    : `Buy ${product.name} for ${product.petType || 'pets'} at petshiwu. Quality products, fast shipping, great prices.`;
  
  // Build keywords
  const categoryName = typeof product.category === 'object' && product.category?.name 
    ? product.category.name 
    : '';
  const keywords = [
    product.name,
    product.brand || '',
    categoryName,
    product.petType || '',
    'pet supplies',
    product.petType === 'dog' ? 'dog food' : '',
    product.petType === 'cat' ? 'cat food' : '',
    'online pet store'
  ].filter(Boolean).join(', ');

  // Build product URL
  const productUrl = `https://petshiwu.com${generateProductUrl(product)}`;
  
  // Get product image for OG
  const productImage = product.images && product.images.length > 0
    ? normalizeImageUrl(product.images[0])
    : '/og-image.jpg';

  return (
    <>
      <SEO
        title={productTitle}
        description={productDescription}
        keywords={keywords}
        image={productImage}
        url={productUrl}
        type="product"
        price={price}
        currency="USD"
        availability={selectedVariantData?.stock && selectedVariantData.stock > 0 ? 'instock' : 'outofstock'}
      />
      <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.path || index} className="flex items-center">
              {index > 0 && <ChevronRight size={16} className="mx-2 text-gray-400" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-900 line-clamp-1">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-primary-600 transition-colors flex items-center gap-1"
                >
                  {index === 0 && <Home size={16} />}
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
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
              {hasDisplayImages && displayImages[safeSelectedImage] ? (
                <img
                  src={normalizeImageUrl(displayImages[safeSelectedImage]) || ''}
                  alt={product?.name || 'Product image'}
                  onError={(e) => {
                    handleImageError(e, product?.name || 'Product');
                    setImageLoaded(false);
                    // Suppress console errors for failed image loads (403, 404, etc.)
                    e.stopPropagation();
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
            {displayImages?.map((image: string, index: number) => (
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
                  onError={(e) => {
                    handleImageError(e, `${product.name} ${index + 1}`);
                    // Suppress console errors for failed image loads (403, 404, etc.)
                    e.stopPropagation();
                  }}
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
          </div>

          {/* Variants - Grouped by Attribute Type */}
          {product.variants.length > 0 && selectedVariantData && (() => {
            // Collect all unique attribute keys from all variants
            const attributeKeys = new Set<string>();
            product.variants.forEach((variant) => {
              if (variant.attributes) {
                Object.keys(variant.attributes).forEach(key => attributeKeys.add(key));
              }
              // Include legacy fields
              if (variant.size) attributeKeys.add('size');
              if (variant.weight) attributeKeys.add('weight');
            });

            // If no attributes, show simple variant selector
            if (attributeKeys.size === 0) {
              return (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedVariant(index);
                          setSelectedImage(0);
                        }}
                        disabled={variant.stock === 0}
                        className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                          selectedVariant === index
                            ? 'border-blue-600 text-blue-600 bg-white'
                            : variant.stock === 0
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 text-gray-900 bg-white hover:border-gray-400'
                        }`}
                      >
                        Variant {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // Get selected attributes from current variant
            const selectedAttributes: { [key: string]: string } = {};
            if (selectedVariantData.attributes) {
              Object.entries(selectedVariantData.attributes).forEach(([key, value]) => {
                selectedAttributes[key] = value as string;
              });
            }
            if (selectedVariantData.size) selectedAttributes.size = selectedVariantData.size;
            if (selectedVariantData.weight) selectedAttributes.weight = selectedVariantData.weight;

            // Function to find variant index by attribute values
            const findVariantByAttributes = (attributes: { [key: string]: string }): number => {
              return product.variants.findIndex((variant) => {
                const variantAttrs: { [key: string]: string } = {};
                if (variant.attributes) {
                  Object.entries(variant.attributes).forEach(([key, value]) => {
                    variantAttrs[key] = value as string;
                  });
                }
                if (variant.size) variantAttrs.size = variant.size;
                if (variant.weight) variantAttrs.weight = variant.weight;

                // Check if all attributes match
                return Object.keys(attributes).every(key => variantAttrs[key] === attributes[key]);
              });
            };

            // Function to handle attribute selection
            const handleAttributeSelect = (attributeKey: string, value: string) => {
              const newSelectedAttributes = { ...selectedAttributes, [attributeKey]: value };
              const variantIndex = findVariantByAttributes(newSelectedAttributes);
              if (variantIndex >= 0) {
                setSelectedVariant(variantIndex);
                setSelectedImage(0);
              }
            };

            // Get unique values for each attribute key
            const getUniqueValues = (key: string): string[] => {
              const values = new Set<string>();
              product.variants.forEach((variant) => {
                if (variant.attributes && variant.attributes[key]) {
                  values.add(variant.attributes[key] as string);
                } else if (key === 'size' && variant.size) {
                  values.add(variant.size);
                } else if (key === 'weight' && variant.weight) {
                  values.add(variant.weight);
                }
              });
              return Array.from(values).sort();
            };

            // Capitalize first letter of attribute key for display
            const formatAttributeKey = (key: string): string => {
              return key.charAt(0).toUpperCase() + key.slice(1);
            };

            return (
              <div className="mb-6 space-y-4">
                {Array.from(attributeKeys).map((attributeKey) => {
                  const uniqueValues = getUniqueValues(attributeKey);
                  const selectedValue = selectedAttributes[attributeKey] || '';
                  
                  return (
                    <div key={attributeKey}>
                      <label className="block text-sm font-medium mb-2 text-gray-900">
                        {formatAttributeKey(attributeKey)}: {selectedValue}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueValues.map((value) => {
                          const isSelected = selectedValue === value;
                          // Check if this value is available (has at least one variant with stock)
                          const hasStock = product.variants.some((variant) => {
                            const variantAttrs: { [key: string]: string } = {};
                            if (variant.attributes) {
                              Object.entries(variant.attributes).forEach(([k, v]) => {
                                variantAttrs[k] = v as string;
                              });
                            }
                            if (variant.size) variantAttrs.size = variant.size;
                            if (variant.weight) variantAttrs.weight = variant.weight;
                            
                            const matches = variantAttrs[attributeKey] === value;
                            return matches && variant.stock > 0;
                          });

                          return (
                            <button
                              key={value}
                              onClick={() => handleAttributeSelect(attributeKey, value)}
                              disabled={!hasStock}
                              className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                                isSelected
                                  ? 'border-blue-600 text-blue-600 bg-white'
                                  : !hasStock
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-gray-300 text-gray-900 bg-white hover:border-gray-400'
                              }`}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

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
                className="w-11 h-11 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center text-lg font-semibold active:scale-95 transition-transform min-w-[44px] min-h-[44px]"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 min-h-[44px]"
                aria-label="Quantity"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-11 h-11 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center text-lg font-semibold active:scale-95 transition-transform min-w-[44px] min-h-[44px]"
                aria-label="Increase quantity"
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
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-primary-600 hover:text-primary-600 transition-colors"
              >
                <Share2 size={20} />
              </button>
              {showShareMenu && socialLinks && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 min-w-[200px]">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded text-left"
                  >
                    <Facebook size={18} className="text-blue-600" />
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded text-left"
                  >
                    <Twitter size={18} className="text-blue-400" />
                    Twitter
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded text-left"
                  >
                    <Mail size={18} />
                    Email
                  </button>
                  <button
                    onClick={() => handleShare('copyLink')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded text-left"
                  >
                    {linkCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                    {linkCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleCompare}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-primary-600 hover:text-primary-600 transition-colors"
            >
              Compare
            </button>
          </div>

          {/* Product Details */}
          <div className="border-t pt-6 space-y-4 mb-6">
            {/* Category & Pet Type */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.category && (
                typeof product.category === 'string' ? (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {product.category}
                  </span>
                ) : (
                  <Link
                    to={`/category/${product.category.slug}${product.petType && product.category.petType !== 'all' ? `?petType=${product.category.petType}` : ''}`}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-200 transition-colors cursor-pointer inline-block"
                  >
                    {typeof product.category === 'object' && product.category?.name ? product.category.name : ''}
                  </Link>
                )
              )}
              {product.petType && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {product.petType.charAt(0).toUpperCase() + product.petType.slice(1)}
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
                <p className="text-sm text-gray-600">On orders over ${FREE_SHIPPING_THRESHOLD}</p>
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
          <div className="mb-6">
            <FormattedDescription description={product.description} />
          </div>

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
                      <h4 className="font-bold text-lg text-gray-900 mb-1">
                        {DOMPurify.sanitize(review.title, { ALLOWED_TAGS: [] })}
                      </h4>
                    )}
                  </div>
                </div>

                {/* Review Author & Date */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    {review.user.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {DOMPurify.sanitize(review.user.firstName, { ALLOWED_TAGS: [] })}
                    </p>
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
                  <p className="text-gray-700 leading-relaxed">
                    {DOMPurify.sanitize(review.comment, { 
                      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
                      ALLOWED_ATTR: []
                    })}
                  </p>
                )}

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {review.images.map((image, idx) => (
                      <img
                        key={idx}
                        src={image}
                        alt={`Review image ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Helpful Button */}
                <div className="mt-4 flex items-center gap-4">
                  <button
                    onClick={async () => {
                      try {
                        await reviewService.voteReviewHelpful(review._id);
                        showToast('Thank you for your feedback!', 'success');
                        // Refetch reviews to update helpful count
                        queryClient.invalidateQueries({ queryKey: ['reviews', product?._id] });
                      } catch (error: any) {
                        showToast(error.response?.data?.message || 'Failed to vote', 'error');
                      }
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
                  >
                    <span>Helpful</span>
                    {review.helpfulCount > 0 && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {review.helpfulCount}
                      </span>
                    )}
                  </button>
                </div>
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

      {/* Frequently Bought Together Section */}
      {frequentlyBoughtTogether && frequentlyBoughtTogether.length > 0 && (
        <div className="mt-16 border-t pt-12">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles size={28} className="text-primary-600" />
            <h2 className="text-3xl font-bold">Frequently Bought Together</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Customers who bought this item also bought these products
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {frequentlyBoughtTogether.map((product: any) => (
              <div key={product._id} className="flex">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Also Bought Section */}
      {customersAlsoBought && customersAlsoBought.length > 0 && (
        <div className="mt-16 border-t pt-12">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles size={28} className="text-primary-600" />
            <h2 className="text-3xl font-bold">Customers Also Bought</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Popular products purchased together with this item
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {customersAlsoBought.map((product: any) => (
              <div key={product._id} className="flex">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Recommendations Section */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-16 border-t pt-12">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles size={28} className="text-primary-600" />
            <h2 className="text-3xl font-bold">You May Also Like</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Recommended products based on your interests
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {recommendations
              .filter((rec) => rec.recommendationType !== 'customers_also_bought' && rec.recommendationType !== 'frequently_bought_together')
              .slice(0, 8)
              .map((product) => (
                <div key={product._id} className="flex">
                  <ProductCard product={product} />
                </div>
              ))}
          </div>
        </div>
      )}

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

      {/* Recently Viewed Section */}
      <div className="mt-16 border-t pt-12">
        <RecentlyViewed limit={8} showTitle={true} showClearButton={false} />
      </div>

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
    </>
  );
};

export default ProductDetail;



