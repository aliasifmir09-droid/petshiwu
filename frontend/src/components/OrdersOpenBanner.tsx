import { ORDERS_OPEN_LABEL, areOrdersOpen } from '@/config/launch';

interface OrdersOpenBannerProps {
  compact?: boolean;
}

const OrdersOpenBanner = ({ compact = false }: OrdersOpenBannerProps) => {
  if (areOrdersOpen()) return null;

  if (compact) {
    return (
      <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        We start taking orders on <strong>{ORDERS_OPEN_LABEL}</strong>. You can browse now — checkout opens that day.
      </p>
    );
  }

  return (
    <div className="bg-amber-400 text-[#1E3A8A]">
      <div className="container mx-auto px-4 py-3 text-center">
        <p className="text-sm sm:text-base font-bold">
          We start taking orders {ORDERS_OPEN_LABEL}
        </p>
        <p className="text-xs sm:text-sm font-medium mt-0.5">
          Browse 10,000+ products now. Checkout and delivery open on launch day.
        </p>
      </div>
    </div>
  );
};

export default OrdersOpenBanner;
