import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import api from '@/services/api';
import { ORDERS_OPEN_LABEL, areOrdersOpen } from '@/config/launch';
import { ORDERING_PAUSED, ORDERING_PAUSED_HEADLINE } from '@/config/ordering';
import { FOOTER_SOCIAL } from '@/config/social';
import BrandLogo from './BrandLogo';
import { FOOTER_SHOP_BRANDS } from '@/data/shopBrands';

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [newsletterCode, setNewsletterCode] = useState('');

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus('loading');
    try {
      const res = await api.post('/v1/newsletter/subscribe', {
        email: newsletterEmail.trim(),
        source: 'footer',
      }, { skipAuth: true });
      setNewsletterCode(res.data?.code || 'FREEDOM20');
      setNewsletterStatus('done');
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('error');
    }
  };

  return (
    <footer className="bg-[#0B1F4A] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex mb-4" aria-label="Petshiwu home">
              <BrandLogo variant="on-navy" />
            </Link>
            <p className="text-blue-100 text-sm mb-4 leading-relaxed">
              Food, treats, and supplies for every pet. Free shipping over $49. No autoship.
            </p>
            <div className="flex gap-4">
              {FOOTER_SOCIAL.map((item) => {
                const Icon = item.network === 'facebook' ? Facebook : Instagram;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-200 hover:text-white transition-colors"
                    aria-label={`Petshiwu on ${item.name}`}
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Shop by Pet */}
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-4">Shop by Pet</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link to="/dog" className="hover:text-white transition-colors">Dogs</Link></li>
              <li><Link to="/cat" className="hover:text-white transition-colors">Cats</Link></li>
              <li><Link to="/bird" className="hover:text-white transition-colors">Birds</Link></li>
              <li><Link to="/reptile" className="hover:text-white transition-colors">Reptiles</Link></li>
              <li><Link to="/fish" className="hover:text-white transition-colors">Fish</Link></li>
              <li><Link to="/small-animal" className="hover:text-white transition-colors">Small Pets</Link></li>
            </ul>
          </div>

          {/* Shop by brand */}
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-4">Shop by brand</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              {FOOTER_SHOP_BRANDS.map((brand) => (
                <li key={brand.slug}>
                  <Link to={`/brand/${brand.slug}`} className="hover:text-white transition-colors">
                    {brand.name}
                  </Link>
                </li>
              ))}
              <li><Link to="/brand" className="hover:text-white transition-colors">All brands</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-4">Help</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Information</Link></li>
              <li><Link to="/delivery-zips" className="hover:text-white transition-colors">Next-day ZIP codes</Link></li>
              <li><Link to="/return-policy" className="hover:text-white transition-colors">365-Day Return Policy</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/search?snap=1" className="hover:text-white transition-colors">Search by photo</Link></li>
              <li><Link to="/track-order" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Start a Return</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link to="/products" className="hover:text-white transition-colors">Shop All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-white transition-colors">Featured</Link></li>
              <li><Link to="/learning" className="hover:text-white transition-colors">Pet Care Blog</Link></li>
              <li><Link to="/learning/next-day-pet-delivery-within-50-miles-of-queens" className="hover:text-white transition-colors">Next-day delivery guide</Link></li>
              <li><Link to="/learning/fall-2026-pet-care-playbook" className="hover:text-white transition-colors">Fall 2026 Playbook</Link></li>
              <li><Link to="/editorial-standards" className="hover:text-white transition-colors">How we write guides</Link></li>
              <li><Link to="/care-guides" className="hover:text-white transition-colors">Care Guides</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/our-promise" className="hover:text-white transition-colors">Our Promise</Link></li>
              <li><Link to="/for-pet-parents" className="hover:text-white transition-colors">For Pet Parents</Link></li>
              <li><Link to="/from-queens" className="hover:text-white transition-colors">How we ship</Link></li>
              <li><Link to="/sell-with-us" className="hover:text-white transition-colors">Sell With Us</Link></li>
              <li><Link to="/investors" className="hover:text-white transition-colors">Investors</Link></li>
              <li><Link to="/donate" className="hover:text-white transition-colors">Donate to Shelters</Link></li>
            </ul>
          </div>

          {/* Popular pages */}
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-4">Popular pages</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link to="/pet-supplies-delivery-nyc" className="hover:text-white transition-colors">Pet Supplies Delivery NYC</Link></li>
              <li><Link to="/pet-supplies-jackson-heights-ny" className="hover:text-white transition-colors">Jackson Heights</Link></li>
              <li><Link to="/pet-supplies-queens-ny" className="hover:text-white transition-colors">Pet Supplies Queens</Link></li>
              <li><Link to="/pet-store-queens-ny" className="hover:text-white transition-colors">Queens delivery, not a walk-in</Link></li>
              <li><Link to="/pet-supplies-brooklyn-ny" className="hover:text-white transition-colors">Brooklyn</Link></li>
              <li><Link to="/pet-supplies-manhattan-ny" className="hover:text-white transition-colors">Manhattan</Link></li>
              <li><Link to="/pet-supplies-bronx-ny" className="hover:text-white transition-colors">The Bronx</Link></li>
              <li><Link to="/pet-supplies-staten-island-ny" className="hover:text-white transition-colors">Staten Island</Link></li>
              <li><Link to="/dog-food-delivery-nyc" className="hover:text-white transition-colors">Dog Food Delivery NYC</Link></li>
              <li><Link to="/cat-food-delivery-nyc" className="hover:text-white transition-colors">Cat Food Delivery NYC</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-blue-100">
              <li>
                <a href="tel:+18002592605" className="hover:text-white transition-colors inline-flex items-start gap-2">
                  <Phone size={16} className="mt-0.5 flex-shrink-0" aria-hidden />
                  <span>+1 (800) 259-2605<br /><span className="text-blue-200/80">24/7 phone support</span></span>
                </a>
              </li>
              <li>
                <a href="mailto:support@petshiwu.com" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Mail size={16} className="flex-shrink-0" aria-hidden />
                  support@petshiwu.com
                </a>
              </li>
              <li className="inline-flex items-start gap-2 leading-relaxed">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" aria-hidden />
                <span>
                  Office & warehouse<br />
                  37-68 74th St<br />
                  Jackson Heights, NY 11372<br />
                  <span className="text-blue-200/80">Not a walk-in store — delivery only</span>
                </span>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2 text-sm">Newsletter</h4>
              <form className="flex gap-2" onSubmit={handleNewsletter}>
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 rounded text-black text-sm min-w-0"
                  aria-label="Email address for newsletter"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'loading'}
                  className="bg-white px-4 py-2 rounded text-sm text-[#1E3A8A] font-semibold hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-60"
                >
                  {newsletterStatus === 'loading' ? '...' : 'Subscribe'}
                </button>
              </form>
              {newsletterStatus === 'done' && (
                <p className="text-green-400 text-xs mt-2">
                  You are in. Use {newsletterCode || 'FREEDOM20'} at checkout — 20% off, max $10.
                </p>
              )}
              {newsletterStatus === 'error' && (
                <p className="text-red-400 text-xs mt-2">Could not subscribe. Email support@petshiwu.com</p>
              )}
            </div>
          </div>

        </div>

        {/* Legal row */}
        <div className="border-t border-white/10 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <p className="text-sm text-blue-100">
              &copy; {new Date().getFullYear()} Petshiwu. All rights reserved. All prices in USD.
              {ORDERING_PAUSED ? (
                <span className="block mt-1 text-amber-300">
                  {ORDERING_PAUSED_HEADLINE}.
                </span>
              ) : !areOrdersOpen() ? (
                <span className="block mt-1 text-amber-300">
                  We start taking orders {ORDERS_OPEN_LABEL}.
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-100">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-white/20">|</span>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-white/20">|</span>
              <Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link>
              <span className="text-white/20">|</span>
              <Link to="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
              <span className="text-white/20">|</span>
              <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
