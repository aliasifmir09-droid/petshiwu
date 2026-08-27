import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buyAgainService } from '@/services/buyAgain';
import { useCartStore } from '@/stores/cartStore';
import { productsForReorder } from '@/utils/reorderFromOrder';
import { ASK_COUPON, AUTOSHIP_COUPON, isRestockCoupon, isRestockPayMethod, rememberRestockCoupon, rememberRestockPay } from '@/utils/restock';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';

const Restock = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addToCart = useCartStore((state) => state.addToCart);
  const [message, setMessage] = useState('Loading your restock…');
  const couponParam = (searchParams.get('coupon') || '').toUpperCase();
  const coupon = isRestockCoupon(couponParam)
    ? couponParam
    : searchParams.get('mode') === 'autoship'
      ? AUTOSHIP_COUPON
      : ASK_COUPON;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await buyAgainService.getBuyAgain();
        const items = (data.reminder?.items?.length ? data.reminder.items : data.usual) || [];
        const fallback = data.lastOrder?.items || [];
        const source = items.length
          ? items.map((item) => ({
              product: item.product,
              quantity: item.quantity,
              variant: item.sku ? { sku: item.sku } : undefined,
            }))
          : fallback;
        if (!source.length) {
          navigate('/#restock', { replace: true });
          return;
        }
        const ready = await productsForReorder(source as any);
        if (cancelled) return;
        let added = 0;
        ready.forEach(({ product, variant, quantity }) => {
          if (addToCart(product, variant, quantity)) added += 1;
        });
        if (!ready.length || added === 0) {
          setMessage('Could not add those items. Open your dashboard to add or remove from the restock cart.');
          return;
        }
        rememberRestockCoupon(coupon);
        const pay = searchParams.get('pay');
        if (isRestockPayMethod(pay)) rememberRestockPay(pay);
        navigate(`/checkout?coupon=${coupon}${isRestockPayMethod(pay) ? `&pay=${pay}` : ''}`, { replace: true });
      } catch {
        if (!cancelled) navigate('/login?redirect=/restock', { replace: true });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [addToCart, coupon, navigate, searchParams]);

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <SEO title="Confirm restock | Petshiwu" noindex={true} />
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-slate-600">{message}</p>
    </div>
  );
};

export default Restock;
