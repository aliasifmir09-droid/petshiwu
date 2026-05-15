import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

// Mobile bottom navigation bar — hidden on lg+ screens
// Matches Chewy/Petco mobile UX pattern

const HIDE_ON = ['/cart', '/checkout', '/login', '/register', '/checkout'];

const BottomNav = () => {
  const { getTotalItems } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const cartCount = getTotalItems();

  // Don't show on pages that have their own bottom CTAs
  if (HIDE_ON.some(path => location.pathname.startsWith(path))) return null;

  const tabs = [
    { icon: Home,         label: 'Home',    path: '/' },
    { icon: Search,       label: 'Search',  path: '/search' },
    { icon: ShoppingCart, label: 'Cart',    path: '/cart',    badge: cartCount },
    { icon: User,         label: 'Account', path: isAuthenticated ? '/profile' : '/login' },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.08)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around">
        {tabs.map(({ icon: Icon, label, path, badge }) => {
          const active = location.pathname === path ||
            (path === '/' && location.pathname === '/');
          return (
            <Link
              key={label}
              to={path}
              className={`flex flex-col items-center gap-0.5 py-2 px-5 min-w-[64px] transition-colors ${
                active ? 'text-blue-600' : 'text-gray-500 active:text-blue-400'
              }`}
              aria-label={label}
            >
              <div className="relative">
                <Icon size={23} strokeWidth={active ? 2.5 : 2} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-0.5 leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-semibold leading-none ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
