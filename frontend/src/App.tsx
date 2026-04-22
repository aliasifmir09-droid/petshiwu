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
import AIChatWidget from './components/AIChatWidget';
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
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'));
const AddressManagement = lazy(() => import('./pages/AddressManagement'));
const StockAlerts = lazy(() => import('./pages/StockAlerts'));
const AdvancedSearch = lazy(() => import('./pages/AdvancedSearch'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Donate = lazy(() => import('./pages/Donate'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Learning = lazy(() => import('./pages/Learning'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const CareGuides = lazy(() => import('./pages/CareGuides'));
const CareGuideDetail = lazy(() => import('./pages/CareGuideDetail'));
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
// SEO Landing Pages
const SensitiveStomachDogs = lazy(() => import('./pages/seo/SensitiveStomachDogs'));
const PickyEaters = lazy(() => import('./pages/seo/PickyEaters'));
const AggressiveChewers = lazy(() => import('./pages/seo/AggressiveChewers'));
// SEO Blog Posts
const BestFoodSensitiveStomach = lazy(() => import('./pages/blog/BestFoodSensitiveStomach'));

// Optimize React Query with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    }
  }
});

// PERFORMANCE FIX: Cache warming on app initialization
const warmCache = async () => {
  try {
    const { default: api } = await import('./services/api');
    await queryClient.prefetchQuery({
      queryKey: ['pet-types'],
      queryFn: async () => {
        const response = await api.get('/pet-types');
        return response.data;
      },
      staleTime: 30 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
    });
    await queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const response = await api.get('/categories');
        return response.data;
      },
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });
  } catch (error) {
    console.debug('Cache warming failed:', error);
  }
};

if (typeof window !== 'undefined') {
  warmCache();
}

// Component to track page views
const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(path, document.title);
  }, [location]);
  return null;
};

function App() {
  const { setUser, setLoading } = useAuthStore();
  const { syncWithBackend } = useWishlistStore();

  useEffect(() => {
    initAnalytics();
    import('./utils/suppressNetworkErrors').then(({ suppressNetworkErrors }) => {
      suppressNetworkErrors();
    });
    const handleGlobalError = (event: ErrorEvent) => {
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'IMG') {
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
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }
      return true;
    };
    window.addEventListener('error', handleGlobalError, true);
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {})
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error('Service Worker registration failed:', error);
          }
        });
    }
    return () => {
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getMe(true);
        if (user) {
          setUser(user);
          await syncWithBackend();
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [setUser, setLoading, syncWithBackend]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
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
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/:petType/:categorySlug" element={<Category />} />
                  <Route path="/category/:slug" element={<Category />} />
                  <Route path="/learning" element={<Learning />} />
                  <Route path="/learning/:slug" element={<BlogDetail />} />
                  <Route path="/care-guides" element={<CareGuides />} />
                  <Route path="/care-guides/:slug" element={<CareGuideDetail />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/about" element={<About />} />
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
                  <Route path="/return-policy" element={<ReturnPolicy />} />
                  <Route path="/addresses" element={<AddressManagement />} />
                  <Route path="/stock-alerts" element={<StockAlerts />} />
                  <Route path="/search" element={<AdvancedSearch />} />
                  <Route path="/best-dog-food-sensitive-stomach-diarrhea" element={<SensitiveStomachDogs />} />
                  <Route path="/high-protein-dog-food-picky-eaters" element={<PickyEaters />} />
                  <Route path="/durable-dog-toys-aggressive-chewers" element={<AggressiveChewers />} />
                  <Route path="/learning/best-dog-foods-sensitive-stomachs" element={<BestFoodSensitiveStomach />} />
                  <Route path="/403" element={<Forbidden />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="/:petType" element={<PetType />} />
                  <Route path="/:petType/*" element={<ProductDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundaryWithReporting>
          </main>
          <Footer />
        </div>
        <AIChatWidget />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
