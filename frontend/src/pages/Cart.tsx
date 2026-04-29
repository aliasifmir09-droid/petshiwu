import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { Trash2, ShoppingBag, AlertTriangle, Heart, Share2, Check, Zap } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import EmptyState from '@/components/EmptyState';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import { generateProductUrl } from '@/utils/productUrl';
import SEO from '@/components/SEO';
import { TAX_RATE, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from '@/config/constants';
import cartService from '@/services/cart';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { useQuery } from '@tanstack/react-query';

const Cart = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const { addToWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'remove' | 'clear' | 'save-for-later' | null;
    productId?: string;
    variantSku?: string;
    productName?: string;
  }>({
    isOpen: false,
    action: null
  });

  const [shareId, setShareId] = useState<string | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | null>(null);

  // Check for shared cart on mount
  useEffect(() => {
    const shareParam = searchParams.get('share');
    if (shareParam) {
      loadSharedCart(shareParam);
    }
  }, [searchParams]);

  // Load shared cart
  const loadSharedCart = async (shareId: string) => {
    try {
      const response = await cartService.getSharedCart(shareId);
      if (response.success && response.data.items) {
        showToast('Shared cart loaded!', 'success');
      }
    } catch (error) {
      showToast('Failed to load shared cart', 'error');
    }
  };

  // ✅ FIXED: Get delivery estimate - wrapped in try/catch to prevent 404 redirect
  const { data: deliveryData } = useQuery({
    queryKey: ['delivery-estimate', 'standard'],
    queryFn: async () => {
      try {
        return await cartService.getDeliveryEstimate('standard');
      } catch (error) {
        // Silently fail — delivery estimate is optional, don't let it break the cart
        return null;
      }
    },
    enabled: items.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false, // ✅ Don't retry — prevents 404 from triggering global error handler
  });

  useEffect(() => {
    if (deliveryData?.data?.estimatedDelivery) {
      setEstimatedDelivery(new Date(deliveryData.data.estimatedDelivery));
    }
  }, [deliveryData]);

  // Save cart to backend (for abandonment recovery)
  useEffect(() => {
    if (items.length > 0) {
      const saveCartToBackend = async () => {
        try {
          const cartItems = items.map(item => ({
            product: item.product._id,
            variant: item.variant,
            quantity: item.quantity,
            price: item.variant?.price || item.product.basePrice,
            name: item.product.name,
            image: item.product.images?.[0]
          }));
          await cartService.saveCart(cartItems, shareId || undefined);
        } catch (error) {
          // Silent fail - cart works without backend sync
        }
      };
      saveCartToBackend();
    }
  }, [items, shareId]);

  // Generate share link
  const generateShareLink = async () => {
    try {
      const cartItems = items.map(item => ({
        product: item.product._id,
        variant: item.variant,
        quantity: item.quantity,
        price: item.variant?.price || item.product.basePrice,
        name: item.product.name,
        image: item.product.images?.[0]
      }));
      const response = await cartService.saveCart(cartItems);
      if (response.success && response.data.shareId) {
        setShareId(response.data.shareId);
        const shareUrl = `${window.location.origin}/cart?share=${response.data.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        setShareLinkCopied(true);
        showToast('Cart link copied to clipboard!', 'success');
        setTimeout(() => setShareLinkCopied(false), 3000);
      }
    } catch (error) {
      showToast('Failed to generate share link', 'error');
    }
  };

  // Save item for later (move to wishlist)
  const handleSaveForLater = async (productId: string) => {
    try {
      await addToWishlist(productId);
      removeFromCart(productId);
      showToast('Item saved to wishlist!', 'success');
    } catch (error) {
      showToast('Failed to save item to wishlist', 'error');
    }
  };

  // One-click checkout
  const handleOneClickCheckout = () => {
    if (!isAuthenticated) {
      showToast('Please log in to use one-click checkout', 'warning');
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout?quick=true');
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  const handleConfirmAction = () => {
    if (confirmModal.action === 'remove' && confirmModal.productId) {
      removeFromCart(confirmModal.productId, confirmModal.variantSku);
    } else if (confirmModal.action === 'clear') {
      clearCart();
    } else if (confirmModal.action === 'save-for-later' && confirmModal.productId) {
      handleSaveForLater(confirmModal.productId);
    }
    setConfirmModal({ isOpen: false, action: null });
  };

  if (items.length === 0) {
    return (
      <>
        <SEO title="Shopping Cart | petshiwu" description="Your shopping cart at petshiwu" noindex={true} />
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <EmptyState
            icon={ShoppingBag}
            title="Your Cart is Empty"
            description="Looks like you haven't added any items to your cart yet. Start shopping to fill it up!"
            action={{ label: "Start Shopping", to: "/products" }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Shopping Cart | petshiwu" description="Your shopping cart at petshiwu" noindex={true} />
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <div className="flex gap-2">
            <button
              onClick={generateShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              title="Share cart"
            >
              {shareLinkCopied ? (
                <><Check size={16} /><span>Copied!</span></>
              ) : (
                <><Share2 size={16} /><span>Share Cart</span></>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {items.map((item) => {
                const price = item.variant?.price || item.product.basePrice;
                return (
                  <div key={`${item.product._id}-${item.variant?.sku}`} className="flex gap-4 p-6 border-b last:border-b-0">
                    {/* Image */}
                    <Link to={generateProductUrl(item.product)} className="flex-shrink-0">
                      <img
                        src={normalizeImageUrl(item.product.images?.[0])}
                        alt={item.product.name}
                        onError={(e) => handleImageError(e, item.product.name)}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1">
                      <Link to={generateProductUrl(item.product)} className="hover:text-primary-600">
                        <h3 className="font-semibold mb-1">{item.product.name}</h3>
                      </Link>
                      <p className="text-sm text-gray-600 mb-2">{item.product.brand}</p>
                      {item.variant && (
                        <p className="text-sm text-gray-600">
                          Size: {item.variant.size || item.variant.weight}
                        </p>
                      )}
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.variant?.sku)}
                          className="w-11 h-11 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-lg font-semibold active:scale-95 transition-transform min-w-[44px] min-h-[44px]"
                          aria-label="Decrease quantity"
                        >-</button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variant?.sku)}
                          className="w-11 h-11 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-lg font-semibold active:scale-95 transition-transform min-w-[44px] min-h-[44px]"
                          aria-label="Increase quantity"
                        >+</button>
                      </div>

                      <p className="text-lg font-bold">${(price * item.quantity).toFixed(2)}</p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, action: 'save-for-later', productId: item.product._id, variantSku: item.variant?.sku, productName: item.product.name })}
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
                          aria-label="Save for later"
                        >
                          <Heart size={16} />
                          <span className="hidden sm:inline">Save</span>
                        </button>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, action: 'remove', productId: item.product._id, variantSku: item.variant?.sku, productName: item.product.name })}
                          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
                          aria-label="Remove item from cart"
                        >
                          <Trash2 size={16} />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setConfirmModal({ isOpen: true, action: 'clear' })}
              className="mt-6 text-red-500 hover:text-red-700 text-sm font-medium px-4 py-3 rounded-lg min-h-[44px] active:scale-95 transition-transform inline-flex items-center"
              aria-label="Clear entire cart"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary - Desktop */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? <span className="text-green-600">FREE</span> : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                {estimatedDelivery && (
                  <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                    <span>Estimated Delivery</span>
                    <span className="font-medium">
                      {estimatedDelivery.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-sm text-gray-600 mb-6">
                  Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for FREE shipping!
                </p>
              )}

              {isAuthenticated && (
                <button
                  onClick={handleOneClickCheckout}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 mb-3 flex items-center justify-center gap-2 transition-all"
                >
                  <Zap size={18} />
                  One-Click Checkout
                </button>
              )}

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 mb-4"
              >
                Proceed to Checkout
              </button>

              <Link to="/products" className="block text-center text-primary-600 hover:text-primary-700 font-medium">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile: Sticky Checkout Button */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl p-4 z-50 safe-area-inset-bottom">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm text-gray-600 block">Total</span>
                <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
                {estimatedDelivery && (
                  <span className="text-xs text-gray-500 block mt-1">
                    Est. delivery: {estimatedDelivery.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <span className="text-xs text-blue-600 font-semibold text-right max-w-[120px]">
                  Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} for FREE shipping
                </span>
              )}
            </div>
            {isAuthenticated && (
              <button
                onClick={handleOneClickCheckout}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold mb-2 flex items-center justify-center gap-2 text-sm"
              >
                <Zap size={16} />
                One-Click Checkout
              </button>
            )}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform min-h-[56px]"
              aria-label="Proceed to checkout"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>

        {/* Bottom padding for mobile sticky button */}
        <div className="lg:hidden h-32"></div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, action: null })}
          onConfirm={handleConfirmAction}
          title={
            confirmModal.action === 'remove' ? 'Remove Item from Cart?'
            : confirmModal.action === 'clear' ? 'Clear Entire Cart?'
            : 'Save for Later?'
          }
          message={
            confirmModal.action === 'remove'
              ? `Are you sure you want to remove "${confirmModal.productName}" from your cart?`
              : confirmModal.action === 'clear'
              ? 'Are you sure you want to remove all items from your cart? This action cannot be undone.'
              : `Save "${confirmModal.productName}" to your wishlist?`
          }
          confirmText={
            confirmModal.action === 'remove' ? 'Remove'
            : confirmModal.action === 'clear' ? 'Clear All'
            : 'Save for Later'
          }
          cancelText="Cancel"
          confirmButtonClass={
            confirmModal.action === 'save-for-later' ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
          }
          icon={
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${confirmModal.action === 'save-for-later' ? 'bg-blue-100' : 'bg-red-100'}`}>
              {confirmModal.action === 'save-for-later'
                ? <Heart className="text-blue-600" size={32} />
                : <AlertTriangle className="text-red-600" size={32} />
              }
            </div>
          }
        />

        {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    </>
  );
};

export default Cart;
