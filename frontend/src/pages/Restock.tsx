import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buyAgainService } from '@/services/buyAgain';
import { useCartStore } from '@/stores/cartStore';
import { productsForReorder } from '@/utils/reorderFromOrder';
import { rememberRestockCoupon, RESTOCK_COUPON } from '@/utils/restock';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';

const Restock = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addToCart = useCartStore((state) => state.addToCart);
  const [message, setMessage] = useState('Loading your restock…');
  const applyAskDiscount = searchParams.get('coupon')?.toUpperCase() === RESTOCK_COUPON;
  const isAutoship = searchParams.get('mode') === 'autoship';

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await buyAgainService.getBuyAgain();
        const items = data.lastOrder?.items || [];
        if (!items.length) {
          navigate('/orders', { replace: true });
          return;
        }
        const ready = await productsForReorder(items as any);
        if (cancelled) return;
        if (!ready.length) {
          setMessage('Those items are no longer in stock.');
          return;
        }
        ready.forEach(({ product, variant, quantity }) => addToCart(product, variant, quantity));
        if (applyAskDiscount) {
          rememberRestockCoupon();
          navigate(`/checkout?coupon=${RESTOCK_COUPON}`, { replace: true });
          return;
        }
        navigate(isAutoship ? '/checkout?mode=autoship' : '/checkout', { replace: true });
      } catch {
        if (!cancelled) navigate('/login?redirect=/restock', { replace: true });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [addToCart, applyAskDiscount, isAutoship, navigate]);

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <SEO title="Confirm restock | Petshiwu" noindex={true} />
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-slate-600">{message}</p>
    </div>
  );
};

export default Restock;
