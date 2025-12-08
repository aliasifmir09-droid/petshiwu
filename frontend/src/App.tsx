import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useWishlistStore } from './stores/wishlistStore';
import { authService } from './services/auth';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundaryWithReporting from './components/ErrorBoundaryWithReporting';
import { initAnalytics, trackPageView } from './utils/analytics';
import './index.css';

// Lazy load pages for code splitting and better performance
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Category = lazy(() => import('./pages/Category'));
const PetType = lazy(() => import('./pages/PetType'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResendVerification = lazy(() => import('./pages/ResendVerification'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const ProductComparison = lazy(() => import('./pages/ProductComparison'));
const Returns = lazy(() => import('./pages/Returns'));
const AddressManagement = lazy(() => import('./pages/AddressManagement'));
const StockAlerts = lazy(() => import('./pages/StockAlerts'));
const AdvancedSearch = lazy(() => import('./pages/AdvancedSearch'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Donate = lazy(() => import('./pages/Donate'));
const Favorites = lazy(() => import('./pages/Favorites'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Forbidden = lazy(() => import('./pages/Forbidden'));

// Optimize React Query with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    }
  }
});

// Component to track page views
const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const path = location.pathname + location.search;
    trackPageView(path, document.title);
  }, [location]);

  return null;
};

function App() {
  const { setUser, setLoading } = useAuthStore();
  const { syncWithBackend } = useWishlistStore();

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
    
    // Suppress expected 401/403 network errors in console
    import('./utils/suppressNetworkErrors').then(({ suppressNetworkErrors }) => {
      suppressNetworkErrors();
    });
    
    // Suppress image loading errors in console (403, 404, etc.)
    // This prevents console spam from external CDN images that fail to load
    const handleGlobalError = (event: ErrorEvent) => {
      // Check if this is an image loading error
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'IMG') {
        // Suppress image loading errors (403, 404, CORS, etc.)
        const errorMessage = event.message || '';
        const errorSource = (event.filename || '').toLowerCase();
        
        if (
          errorMessage.includes('403') ||
          errorMessage.includes('404') ||
          errorMessage.includes('Failed to load') ||
          errorSource.includes('scene7') ||
          errorSource.includes('petsmart') ||
          (target as HTMLImageElement).src?.includes('scene7') ||
          (target as HTMLImageElement).src?.includes('petsmart')
        ) {
          // Prevent the error from appearing in console
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }
      return true;
    };
    
    // Add global error listener for image errors
    window.addEventListener('error', handleGlobalError, true);
    
    // Register service worker for offline support
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          // Service Worker registered successfully - no need to log
        })
        .catch((error) => {
          // Only log errors in development
          if (import.meta.env.DEV) {
            console.error('Service Worker registration failed:', error);
          }
        });
    }
    
    // Cleanup: remove error listener on unmount
    return () => {
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      // Phase 2: Cookie-Only - Try to get user from backend using httpOnly cookie
      // If cookie exists, request will succeed. If not, it will fail and we set user to null
      // Use skipAuth=true to prevent 401 errors from being logged in browser console
      try {
        const user = await authService.getMe(true); // skipAuth=true prevents console spam
        // Only set user if we got a valid response
        if (user) {
          setUser(user);
          // Sync wishlist with backend after user loads
          await syncWithBackend();
        } else {
          setUser(null);
        }
      } catch (error) {
        // No cookie or invalid cookie - user is not authenticated
        // This is expected after logout, so don't log as error
        // skipAuth flag ensures this 401 error is silently handled
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [setUser, setLoading, syncWithBackend]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PageViewTracker />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <ErrorBoundaryWithReporting>
              <Suspense fallback={
                <div className="container mx-auto px-4 py-12">
                  <LoadingSpinner size="lg" />
                </div>
              }>
                        <Routes>
                          {/* Most specific routes first */}
                          <Route path="/" element={<Home />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/products/:slug" element={<ProductDetail />} />
                          <Route path="/category/:slug" element={<Category />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/verify-email" element={<VerifyEmail />} />
                          <Route path="/resend-verification" element={<ResendVerification />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/orders/:id" element={<OrderDetail />} />
                          <Route path="/orders" element={<MyOrders />} />
                          <Route path="/track-order" element={<TrackOrder />} />
                          <Route path="/donate" element={<Donate />} />
                          <Route path="/favorites" element={<Favorites />} />
                          <Route path="/compare" element={<ProductComparison />} />
                          <Route path="/returns" element={<Returns />} />
                          <Route path="/addresses" element={<AddressManagement />} />
                          <Route path="/stock-alerts" element={<StockAlerts />} />
                          <Route path="/search" element={<AdvancedSearch />} />
                          <Route path="/403" element={<Forbidden />} />
                          <Route path="/404" element={<NotFound />} />
                          {/* Less specific routes - pet type pages */}
                          <Route path="/:petType" element={<PetType />} />
                          {/* SEO-friendly product URLs with category hierarchy: /petType/categoryPath/productSlug */}
                          {/* This catch-all route must come last to avoid intercepting specific routes */}
                          <Route path="/:petType/*" element={<ProductDetail />} />
                          {/* Final catch-all for 404 */}
                          <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </ErrorBoundaryWithReporting>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;



