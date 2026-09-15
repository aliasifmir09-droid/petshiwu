import { ORDERS_OPEN_LABEL, areOrdersOpen } from '@/config/launch';
import {
  ORDERING_PAUSED,
  ORDERING_PAUSED_HEADLINE,
  ORDERING_PAUSED_SHORT,
} from '@/config/ordering';
import { CATALOG_PRODUCT_COUNT_LABEL } from '@/config/catalog';

interface OrdersOpenBannerProps {
  compact?: boolean;
}

const OrdersOpenBanner = ({ compact = false }: OrdersOpenBannerProps) => {
  if (ORDERING_PAUSED) {
    if (compact) {
      return (
        <p className="text-sm text-[#1E3A8A] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <strong>{ORDERING_PAUSED_HEADLINE}.</strong> {ORDERING_PAUSED_SHORT}
        </p>
      );
    }

    return (
      <div className="bg-[#1E3A8A] text-white">
        <div className="container mx-auto px-4 py-3 text-center">
          <p className="text-sm sm:text-base font-bold">{ORDERING_PAUSED_HEADLINE}</p>
          <p className="text-xs sm:text-sm font-medium mt-0.5 text-blue-100">
            Browse {CATALOG_PRODUCT_COUNT_LABEL} products now. Checkout will open as soon as we are ready.
          </p>
        </div>
      </div>
    );
  }

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
          Browse {CATALOG_PRODUCT_COUNT_LABEL} products now. Checkout and delivery open on launch day.
        </p>
      </div>
    </div>
  );
};

export default OrdersOpenBanner;
