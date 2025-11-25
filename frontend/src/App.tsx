import { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { authService } from './services/auth';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

// Lazy load pages for code splitting and better performance
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Donate = lazy(() => import('./pages/Donate'));
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

function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await authService.getMe();
          setUser(user);
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        setLoading(false);
      }
    };

    loadUser();
  }, [setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Suspense fallback={
              <div className="container mx-auto px-4 py-12">
                <LoadingSpinner size="lg" />
              </div>
            }>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/403" element={<Forbidden />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;



