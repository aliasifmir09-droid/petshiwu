import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { Trash2, ShoppingBag, AlertTriangle } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import { generateProductUrl } from '@/utils/productUrl';
import { TAX_RATE, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from '@/config/constants';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'remove' | 'clear' | null;
    productId?: string;
    variantSku?: string;
    productName?: string;
  }>({
    isOpen: false,
    action: null
  });

  const subtotal = getTotalPrice();
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  const handleConfirmAction = () => {
    if (confirmModal.action === 'remove' && confirmModal.productId) {
      removeFromCart(confirmModal.productId, confirmModal.variantSku);
    } else if (confirmModal.action === 'clear') {
      clearCart();
    }
    setConfirmModal({ isOpen: false, action: null });
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/products"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

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
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variant?.sku)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-lg font-bold">${(price * item.quantity).toFixed(2)}</p>

                    <button
                      onClick={() => setConfirmModal({
                        isOpen: true,
                        action: 'remove',
                        productId: item.product._id,
                        variantSku: item.variant?.sku,
                        productName: item.product.name
                      })}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              action: 'clear'
            })}
            className="mt-4 text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div>
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
                  {shipping === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {subtotal < 49 && (
              <p className="text-sm text-gray-600 mb-6">
                Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for FREE shipping!
              </p>
            )}

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 mb-4"
            >
              Proceed to Checkout
            </button>

            <Link
              to="/products"
              className="block text-center text-primary-600 hover:text-primary-700 font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null })}
        onConfirm={handleConfirmAction}
        title={confirmModal.action === 'remove' ? 'Remove Item from Cart?' : 'Clear Entire Cart?'}
        message={
          confirmModal.action === 'remove'
            ? `Are you sure you want to remove "${confirmModal.productName}" from your cart?`
            : 'Are you sure you want to remove all items from your cart? This action cannot be undone.'
        }
        confirmText={confirmModal.action === 'remove' ? 'Remove' : 'Clear All'}
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
        }
      />
    </div>
  );
};

export default Cart;



