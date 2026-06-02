import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Petshiwu Logo"
                width={80}
                height={80}
                className="h-20 w-20 object-contain drop-shadow-lg"
                loading="lazy"
                decoding="async"
                style={{ aspectRatio: '1 / 1' }}
              />
              <h3 className="text-xl font-black bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Petshiwu
              </h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Your one-stop shop for premium pet products. Committed to providing the best for your furry, feathered, and scaly friends.
            </p>
            {/* Social media links */}
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/petshiwu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="PetShiwu on Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://twitter.com/petshiwu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="PetShiwu on Twitter / X"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://www.instagram.com/petshiwu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="PetShiwu on Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.youtube.com/@petshiwu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="PetShiwu on YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Shop by Pet */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop by Pet</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/dog" className="hover:text-white transition-colors">🐕 Dogs</Link></li>
              <li><Link to="/cat" className="hover:text-white transition-colors">🐱 Cats</Link></li>
              <li><Link to="/bird" className="hover:text-white transition-colors">🐦 Birds</Link></li>
              <li><Link to="/reptile" className="hover:text-white transition-colors">🦎 Reptiles</Link></li>
              <li><Link to="/fish" className="hover:text-white transition-colors">🐟 Fish</Link></li>
              <li><Link to="/small-pet" className="hover:text-white transition-colors">🐹 Small Pets</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Help</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Information</Link></li>
              <li><Link to="/return-policy" className="hover:text-white transition-colors">Return & Exchange Policy</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/track-order" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Start a Return</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-white transition-colors">Shop All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-white transition-colors">Today's Deals</Link></li>
              <li><Link to="/learning" className="hover:text-white transition-colors">Pet Care Blog</Link></li>
              <li><Link to="/care-guides" className="hover:text-white transition-colors">Care Guides</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/donate" className="hover:text-white transition-colors">Donate to Shelters</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="tel:+18002592605" className="hover:text-white transition-colors">
                  📞 +1 (800) 259-2605
                </a>
              </li>
              <li>
                <a href="mailto:support@petshiwu.com" className="hover:text-white transition-colors">
                  📧 support@petshiwu.com
                </a>
              </li>
              <li className="mt-3 leading-relaxed">📍 37-68 74th St<br />Jackson Heights, NY 11372</li>
              <li className="mt-1">🕐 Mon-Fri: 9AM - 8PM EST</li>
              <li>🕐 Sat-Sun: 9AM - 6PM EST</li>
            </ul>
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2 text-sm">Newsletter</h4>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 rounded text-black text-sm min-w-0"
                  aria-label="Email address for newsletter"
                />
                <button
                  type="submit"
                  className="bg-blue-600 px-4 py-2 rounded text-sm text-white font-semibold hover:bg-blue-700 transition-colors shrink-0"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Legal row */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} PetShiwu. All rights reserved. All prices in USD.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-gray-700">|</span>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-gray-700">|</span>
              <Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link>
              <span className="text-gray-700">|</span>
              <Link to="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
              <span className="text-gray-700">|</span>
              <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
