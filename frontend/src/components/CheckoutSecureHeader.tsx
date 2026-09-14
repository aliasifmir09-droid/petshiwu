import { Link } from 'react-router-dom';
import { Lock, Phone } from 'lucide-react';
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from '@/config/constants';

const CheckoutSecureHeader = () => (
  <header className="sticky top-0 z-50 border-b border-blue-950/40 bg-[#1E3A8A] text-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.55)]">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
      <Link to="/" className="flex min-w-0 items-center gap-3">
        <img
          src="/logo-square-192.png"
          alt="Petshiwu"
          width={36}
          height={36}
          className="h-9 w-9 rounded-lg bg-white object-contain p-0.5"
        />
        <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Lock className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <span className="truncate">Secure checkout</span>
        </span>
      </Link>
      <div className="flex items-center gap-3 text-sm sm:gap-5">
        <a
          href={`tel:${CONTACT_PHONE_TEL}`}
          className="inline-flex items-center gap-1.5 text-blue-100 transition hover:text-white"
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Questions? 24/7 · {CONTACT_PHONE}</span>
          <span className="sm:hidden">24/7 help</span>
        </a>
        <Link
          to="/products"
          className="hidden whitespace-nowrap text-white/85 transition hover:text-amber-300 md:inline"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  </header>
);

export default CheckoutSecureHeader;
