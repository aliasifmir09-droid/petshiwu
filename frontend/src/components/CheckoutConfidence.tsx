import { Check, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from '@/config/constants';

const POINTS = [
  'No surprise autoship — nothing ships or charges unless you confirm',
  '365-day returns on unused items',
  'Encrypted, PayPal-secured transactions',
  '24/7 humans on the phone — not a bot',
  'Packed in Queens for same-day NYC delivery',
];

const CheckoutConfidence = () => (
  <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] shadow-inner ring-4 ring-amber-200/70">
        <Lock className="h-5 w-5 text-amber-300" aria-hidden />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900">Shop with confidence</h3>
        <p className="mt-0.5 text-sm text-slate-600">Your order is safe and secure with Petshiwu.</p>
      </div>
    </div>
    <ul className="mt-4 space-y-2.5">
      {POINTS.map((point) => (
        <li key={point} className="flex items-start gap-2.5 text-sm text-slate-800">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" strokeWidth={2.75} aria-hidden />
          <span>{point}</span>
        </li>
      ))}
    </ul>
    <p className="mt-4 text-sm text-slate-600">
      Questions?{' '}
      <a href={`tel:${CONTACT_PHONE_TEL}`} className="font-semibold text-[#1E3A8A] hover:underline">
        {CONTACT_PHONE}
      </a>
      <span className="text-slate-400"> · </span>
      <Link to="/return-policy" className="font-semibold text-[#1E3A8A] hover:underline">
        365-day returns
      </Link>
    </p>
  </aside>
);

export default CheckoutConfidence;
