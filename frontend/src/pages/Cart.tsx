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

const safePrice = (item: any): number => {
  try {
    const p = item?.variant?.price ?? item?.product?.basePrice ?? item?.product?.price ?? 0;
    const n = Number(p);
    return isNaN(n) ? 0 : n;
  } catch { return 0; }
};

const safeImage = (item: any): string => {
  try {
    return item?.product?.images?.[0] || item?.product?.image || item?.image || '';
  } catch { return ''; }
};

const safeName = (item: any): string => {
  try {
    return item?.product?.name || item?.name || 'Product';
  } catch { return 'Product'; }
};

const safeBrand = (item: any): string => {
  try {
    return item?.product?.brand || item?.brand || '';
  } catch { return ''; }
};

const safeProductId = (item: any): string => {
  try {
    return item?.product?._id || item?.product?.id || item?._id || '';
  } catch { return ''; }
};

const safeQuantity = (item: any): number => {
  try {
    const q = Number(item?.quantity);
    return isNaN(q) || q < 1 ? 1 : q;
  } catch { return 1; }
};

const Cart = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  let storeItems: any[] = [];
  let removeFromCart: Function = () => {};
  let updateQuantity: Function = () => {};
  let getTotalPrice: Function = () => 0;
  let clearCart: Function = () => {};

  try {
    const cartStore = useCartStore();
    storeItems = Array.isArray(cartStore.items) ? cartStore.items : [];
    removeFromCart = cartStore.removeFromCart || (() => {});
    updateQuantity = cartStore.updateQuantity || (() => {});
    getTotalPrice = cartStore.getTotalPrice || (() => 0);
    clearCart = cartStore.clearCart || (() => {});
  } catch (e) {
    console.warn('Cart store error:', e);
  }

  const items = storeItems.filter((item) => {
    try { return item && (item.product || item.name); }
    catch { return false; }
  });

  let addToWishlist: Function = async () => {};
  try {
    const wishlistStore = useWishlistStore();
    addToWishlist = wishlistStore.addToWishlist || (async () => {});
  } catch (e) {
    console.warn('Wishlist store error:', e);
  }

  let isAuthenticated = false;
  try {
    const authStore = useAuthStore();
    isAuthenticated = authStore.isAuthenticated || false;
  } catch (e) {
    console.warn('Auth store error:', e);
  }

  const { toast, showToast, hideToast } = useToast();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'remove' | 'clear' | 'save-for-later' | null;
    productId?: string;
    variantSku?: string;
    productName?: string;
  }>({ isOpen: false, action: null });

  const [shareId, setShareId] = useState<string | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | null>(null);

  useEffect(() => {
    const shareParam = searchParams.get('share');
    if (shareParam) loadSharedCart(shareParam);
  }, [searchParams]);

  const loadSharedCart = async (id: string) => {
    try {
      const response = await cartService.getSharedCart(id);
      if (response?.success && response?.data?.items) {
        showToast('Shared cart loaded!', 'success');
      }
    } catch {
      showToast('Failed to load shared cart', 'error');
    }
  };

  const { data: deliveryData } = useQuery({
    queryKey: ['delivery-estimate', 'standard'],
    queryFn: async () => {
      try { return await cartService.getDeliveryEstimate('standard'); }
      catch { return null; }
    },
    enabled: items.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    try {
      if (deliveryData?.data?.estimatedDelivery) {
        setEstimatedDelivery(new Date(deliveryData.data.estimatedDelivery));
      }
    } catch { }
  }, [deliveryData]);

  useEffect(() => {
    if (items.length === 0) return;
    const saveCartToBackend = async () => {
      try {
        const cartItems = items.map((item) => ({
          product: safeProductId(item),
          variant: item?.variant || null,
          quantity: safeQuantity(item),
          price: safePrice(item),
          name: safeName(item),
          image: safeImage(item),
        })).filter((i) => i.product);
        if (cartItems.length > 0) {
          await cartService.saveCart(cartItems, shareId || undefined);
        }
      } catch { }
    };
    saveCartToBackend();
  }, [items, shareId]);

  const generateShareLink = async () => {
    try {
      const cartItems = items.map((item) => ({
        product: safeProductId(item),
        variant: item?.variant || null,
        quantity: safeQuantity(item),
        price: safePrice(item),
        name: safeName(item),
        image: safeImage(item),
      })).filter((i) => i.product);
      const response = await cartService.saveCart(cartItems);
      if (response?.success && response?.data?.shareId) {
        setShareId(response.data.shareId);
        const shareUrl = `${window.location.origin}/cart?share=${response.data.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        setShareLinkCopied(true);
        showToast('Cart link copied to clipboard!', 'success');
        setTimeout(() => setShareLinkCopied(false), 3000);
      }
    } catch {
      showToast('Failed to generate share link', 'error');
    }
  };

  const handleSaveForLater = async (productId: string) => {
    try {
      await addToWishlist(productId);
      removeFromCart(productId);
      showToast('Item saved to wishlist!', 'success');
    } catch {
      showToast('Failed to save item to wishlist', 'error');
    }
  };

  const handleOneClickCheckout = () => {
    if (!isAuthenticated) {
      showToast('Please log in to use one-click checkout', 'warning');
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout?quick=true');
  };

  const subtotal = (() => {
    try {
      const t = typeof getTotalPrice === 'function' ? getTotalPrice() : 0;
      const n = Number(t);
      if (isNaN(n)) return items.reduce((sum, item) => sum + safePrice(item) * safeQuantity(item), 0);
      return n;
    } catch {
      return items.reduce((sum, item) => sum + safePrice(item) * safeQuantity(item), 0);
    }
  })();

  const shipping = subtotal > (FREE_SHIPPING_THRESHOLD || 49) ? 0 : (STANDARD_SHIPPING_COST || 9.99);
  const tax = subtotal * (TAX_RATE || 0.08);
  const total = subtotal + shipping + tax;

  const handleConfirmAction = () => {
    try {
      if (confirmModal.action === 'remove' && confirmModal.productId) {
        removeFromCart(confirmModal.productId, confirmModal.variantSku);
      } else if (confirmModal.action === 'clear') {
        clearCart();
      } else if (confirmModal.action === 'save-for-later' && confirmModal.productId) {
        handleSaveForLater(confirmModal.productId);
      }
    } catch (e) {
      console.warn('Cart action error:', e);
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
            action={{ label: 'Start Shopping', to: '/products' }}
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
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {items.map((item, index) => {
                try {
                  const productId = safeProductId(item);
                  const price = safePrice(item);
                  const quantity = safeQuantity(item);
                  const name = safeName(item);
                  const brand = safeBrand(item);
                  const image = safeImage(item);
                  const variantSku = item?.variant?.sku;
                  const itemKey = `${productId}-${variantSku || index}`;

                  return (
                    <div key={itemKey} className="flex gap-4 p-6 border-b last:border-b-0">
                      <Link to={item?.product ? generateProductUrl(item.product) : '/products'} className="flex-shrink-0">
                        <img
                          src={normalizeImageUrl(image)}
                          alt={name}
                          onError={(e) => handleImageError(e, name)}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link to={item?.product ? generateProductUrl(item.product) : '/products'} className="hover:text-primary-600">
                          <h3 className="font-semibold mb-1">{name}</h3>
                        </Link>
                        {brand && <p className="text-sm text-gray-600 mb-2">{brand}</p>}
                        {item?.variant && (item.variant.size || item.variant.weight) && (
                          <p className="text-sm text-gray-600">Size: {item.variant.size || item.variant.weight}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(productId, quantity - 1, variantSku)}
                            className="w-11 h-11 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-lg font-semibold active:scale-95 transition-transform min-w-[44px] min-h-[44px]"
                            aria-label="Decrease quantity"
                          >-</button>
                          <span className="w-12 text-center font-medium">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(productId, quantity + 1, variantSku)}
                            className="w-11 h-11 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-lg font-semibold active:scale-95 transition-transform min-w-[44px] min-h-[44px]"
                            aria-label="Increase quantity"
                          >+</button>
                        </div>
                        <p className="text-lg font-bold">${(price * quantity).toFixed(2)}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmModal({ isOpen: true, action: 'save-for-later', productId, variantSku, productName: name })}
                            className="text-blue-500 hover:text-blue-700 flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
                            aria-label="Save for later"
                          >
                            <Heart size={16} />
                            <span className="hidden sm:inline">Save</span>
                          </button>
                          <button
                            onClick={() => setConfirmModal({ isOpen: true, action: 'remove', productId, variantSku, productName: name })}
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
                } catch (itemError) {
                  console.warn('Skipping corrupted cart item:', itemError);
                  return null;
                }
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
              {subtotal < (FREE_SHIPPING_THRESHOLD || 49) && (
                <p className="text-sm text-gray-600 mb-6">
                  Add ${((FREE_SHIPPING_THRESHOLD || 49) - subtotal).toFixed(2)} more for FREE shipping!
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
              {subtotal < (FREE_SHIPPING_THRESHOLD || 49) && (
                <span className="text-xs text-blue-600 font-semibold text-right max-w-[120px]">
                  Add ${((FREE_SHIPPING_THRESHOLD || 49) - subtotal).toFixed(2)} for FREE shipping
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

        <div className="lg:hidden h-32"></div>

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
            confirmModal.action === 'save-for-later' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
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
