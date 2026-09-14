import { Link } from 'react-router-dom';
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from '@/config/constants';

const CheckoutHelpFooter = () => (
  <footer className="border-t border-slate-200 bg-white">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 lg:px-8 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Questions? We&apos;re here 24 hours a day:{' '}
        <a href={`tel:${CONTACT_PHONE_TEL}`} className="font-semibold text-[#1E3A8A] hover:underline">
          {CONTACT_PHONE}
        </a>
      </p>
      <nav className="flex flex-wrap gap-x-4 gap-y-1">
        <Link to="/privacy" className="hover:text-[#1E3A8A] hover:underline">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-[#1E3A8A] hover:underline">Terms of Use</Link>
        <Link to="/return-policy" className="hover:text-[#1E3A8A] hover:underline">365-Day Returns</Link>
      </nav>
    </div>
  </footer>
);

export default CheckoutHelpFooter;
