import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orders';
import { Search, Loader2, MapPin, Phone, XCircle } from 'lucide-react';
import { TONIGHT } from '@/data/tonightDelivery';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import OrderFireworks from '@/components/OrderFireworks';
import OrderShippingStatus from '@/components/OrderShippingStatus';
import GoogleCustomerReviewsOptIn from '@/components/GoogleCustomerReviewsOptIn';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { guestSetPasswordPath, readGuestCheckoutAccount } from '@/utils/guestCheckoutAccount';
import { trackLogin } from '@/utils/analytics';
import { decodeHtmlEntities } from '@/utils/htmlUtils';
import { handleImageError, normalizeImageUrl } from '@/utils/imageUtils';

const TrackOrder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, setUser } = useAuthStore();
  const guestCheckout = readGuestCheckoutAccount();
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [searchOrderId, setSearchOrderId] = useState(searchParams.get('order') || '');
  const [celebrate, setCelebrate] = useState(searchParams.get('newOrder') === 'true');
  const wasNewOrderRef = useRef(searchParams.get('newOrder') === 'true');
  const confirmationOrderRef = useRef(searchParams.get('order') || '');

  useEffect(() => {
    const fromUrl = searchParams.get('order');
    if (fromUrl && fromUrl !== searchOrderId) {
      setOrderId(fromUrl);
      setSearchOrderId(fromUrl);
    }
  }, [searchParams, searchOrderId]);

  useEffect(() => {
    if (searchParams.get('newOrder') === 'true') {
      setCelebrate(true);
    }
  }, [searchParams]);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['trackOrder', searchOrderId],
    queryFn: () => orderService.trackOrder(searchOrderId),
    enabled: !!searchOrderId,
    retry: false,
    refetchInterval: (query) => {
      const current = query.state.data;
      if (!current) return false;
      if (current.orderStatus === 'delivered' || current.orderStatus === 'cancelled') return false;
      return 30000;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      setSearchOrderId(orderId.trim());
    }
  };

  const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <GoogleCustomerReviewsOptIn
        enabled={wasNewOrderRef.current && !celebrate && searchOrderId === confirmationOrderRef.current}
        order={order}
      />
      {celebrate && (
        <OrderFireworks
          active
          onDone={() => {
            setCelebrate(false);
            if (searchParams.get('newOrder') === 'true') {
              searchParams.delete('newOrder');
              setSearchParams(searchParams, { replace: true });
            }
          }}
        />
      )}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-3">
            Track your delivery
          </h1>
          <p className="text-stone-600">
            See where your order is, when it should arrive, and how to reach a person if you need one.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="orderId" className="block text-sm font-semibold text-gray-700 mb-2">
                Order ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="orderId"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter your order ID"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3 bg-[#1E3A8A] text-white font-bold rounded-lg hover:bg-[#163074] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Track Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={48} />
            <p className="text-gray-600">Loading order information...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <XCircle className="mx-auto text-red-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-600 mb-4">
              {(error as any)?.response?.data?.message || 'Unable to find an order with that ID. Please check your order ID and try again.'}
            </p>
            <Link
              to="/contact"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        )}

        {/* Order Details */}
        {order && !isLoading && (
          <div className="space-y-6">
            <OrderShippingStatus order={order} orderNumber={order.orderNumber} />

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 py-4 border-b border-gray-200 last:border-0">
                    {item.image ? (
                      <img
                        src={normalizeImageUrl(item.image)}
                        alt=""
                        className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                        onError={handleImageError}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{decodeHtmlEntities(item.name)}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatMoney(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-blue-600" size={24} />
                Delivering to
              </h2>
              <div className="text-gray-700">
                <p className="font-semibold">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p className="mt-3 text-sm text-stone-500">
                  The full street is on your receipt. This public page hides it so a shared link stays private.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Items Total:</span>
                  <span className="font-semibold">{formatMoney(order.itemsPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping:</span>
                  <span className="font-semibold">
                    {order.shippingPrice === 0 ? <span className="text-emerald-700">FREE</span> : formatMoney(order.shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax:</span>
                  <span className="font-semibold">{formatMoney(order.taxPrice)}</span>
                </div>
                <div className="border-t border-gray-300 pt-3 flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-black text-[#1E3A8A]">{formatMoney(order.totalPrice)}</span>
                </div>
                <p className="pt-1 text-sm text-stone-500">
                  {order.paymentStatus === 'paid' || order.isPaid
                    ? 'Payment received.'
                    : order.paymentMethod === 'cod'
                      ? 'Pay the driver when the order arrives.'
                      : 'Payment is still clearing. We pack after it lands.'}
                </p>
              </div>
            </div>

            {/* Guest password — they never chose one at checkout */}
            {!isAuthenticated && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Keep this order on your account</h2>
                <p className="text-gray-700 mb-4">
                  You paid as a guest, so there is no password. Continue with Google using the Gmail from this order
                  {guestCheckout?.email ? (
                    <> (<span className="font-semibold">{guestCheckout.email}</span>)</>
                  ) : null}
                  . Your order attaches automatically.
                </p>
                <div className="mb-4 max-w-sm">
                  <GoogleSignInButton
                    onSuccess={async () => {
                      await new Promise((resolve) => setTimeout(resolve, 100));
                      const user = await authService.getMe();
                      setUser(user);
                      const { persistLocalCartAfterLogin } = await import('@/utils/persistLocalCartAfterLogin');
                      await persistLocalCartAfterLogin();
                      trackLogin('google');
                      navigate('/orders');
                    }}
                    onError={() => navigate('/login')}
                  />
                </div>
                <div>
                  <Link
                    to={guestSetPasswordPath(guestCheckout?.email)}
                    className="text-blue-700 font-semibold underline"
                  >
                    Or create a password instead
                  </Link>
                </div>
              </div>
            )}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl shadow-lg p-6 md:p-8 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Need a person?</h3>
              <p className="text-gray-600 mb-4">
                A Petshiwü teammate answers 24/7. This is our own delivery from Queens — not UPS or FedEx.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`tel:${TONIGHT.phone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white font-semibold rounded-lg hover:bg-[#163074] transition-colors"
                >
                  <Phone size={18} />
                  Call {TONIGHT.phone}
                </a>
                <Link
                  to="/contact"
                  className="px-6 py-3 bg-white text-[#1E3A8A] font-semibold rounded-lg border-2 border-[#1E3A8A] hover:bg-blue-50 transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  to={isAuthenticated ? '/orders' : '/login'}
                  className="px-6 py-3 bg-white text-[#1E3A8A] font-semibold rounded-lg border-2 border-[#1E3A8A] hover:bg-blue-50 transition-colors"
                >
                  {isAuthenticated ? 'View My Orders' : 'Sign in'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;

