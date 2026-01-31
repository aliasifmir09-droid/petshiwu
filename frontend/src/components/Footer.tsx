import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/logo.png" 
                alt="Petshiwu Logo" 
                width={56}
                height={56}
                className="h-14 w-14 object-contain drop-shadow-lg"
                loading="lazy"
                decoding="async"
                style={{ aspectRatio: '1 / 1' }}
              />
              <h3 className="text-xl font-black bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Petshiwu
              </h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Your one-stop shop for premium pet products. We're committed to providing the best for your furry, feathered, and scaly friends.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/contact" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-white">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-white">
                  Return & Exchange Policy
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-white">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/products" className="hover:text-white">
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link to="/products?featured=true" className="hover:text-white">
                  Today's Deals
                </Link>
              </li>
              <li>
                <Link to="/brands" className="hover:text-white">
                  Shop by Brand
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white">
                  Pet Care Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="tel:+16263420419" className="hover:text-white">
                  📞 +1 (626) 342-0419
                </a>
              </li>
              <li>
                <a href="mailto:support@petshiwu.com" className="hover:text-white">
                  📧 support@petshiwu.com
                </a>
              </li>
              <li className="mt-3">📍 37-68 74th St<br />Jackson Heights, NY 11372</li>
              <li>🕐 Mon-Fri: 9AM - 8PM EST</li>
              <li>🕐 Sat-Sun: 9AM - 6PM EST</li>
            </ul>
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2">Newsletter</h4>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 rounded text-black text-sm"
                />
                <button className="bg-primary-700 px-4 py-2 rounded text-sm text-white font-semibold hover:bg-primary-800 transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} petshiwu. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-white">
              Terms of Service
            </Link>
            <span>|</span>
            <Link to="/accessibility" className="hover:text-white">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



