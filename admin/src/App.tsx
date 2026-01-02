import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { adminService } from './services/adminService';
import Sidebar from './components/Sidebar';
import PasswordExpiryWarning from './components/PasswordExpiryWarning';
import OrderNotificationManager from './components/OrderNotificationManager';
import './index.css';

// Lazy load pages for code splitting and better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Orders = lazy(() => import('./pages/Orders'));
const Categories = lazy(() => import('./pages/Categories'));
const PetTypes = lazy(() => import('./pages/PetTypes'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Customers = lazy(() => import('./pages/Customers'));
const EmailTemplates = lazy(() => import('./pages/EmailTemplates'));
const Slideshow = lazy(() => import('./pages/Slideshow'));
const Blogs = lazy(() => import('./pages/Blogs'));
const CareGuides = lazy(() => import('./pages/CareGuides'));
const FAQs = lazy(() => import('./pages/FAQs'));
const Login = lazy(() => import('./pages/Login'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
      refetchOnMount: true, // Refetch if data is stale (default behavior)
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (Unauthorized) - user needs to login
        if (error?.response?.status === 401) {
          return false;
        }
        // Retry once for other errors
        return failureCount < 1;
      },
      staleTime: 30 * 1000, // Consider data fresh for 30 seconds (prevents unnecessary refetches)
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes (formerly cacheTime)
    }
  }
});

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Suppress expected 401/403 network errors in console
  useEffect(() => {
    import('./utils/suppressNetworkErrors').then(({ suppressNetworkErrors }) => {
      suppressNetworkErrors();
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadUser = async () => {
      // Phase 2: Cookie-Only - Try to get user from backend using httpOnly cookie
      // If cookie exists, request will succeed. If not, it will fail and we set user to null
      // Use skipAuth to prevent redirect loops when on login page
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/login/';
      
      try {
        // Use skipAuth when on login page to prevent redirect loops
        const userData = await adminService.getMe(isLoginPage);
        
        // Only update state if component is still mounted
        if (mounted) {
          if (userData && (userData.role === 'admin' || userData.role === 'staff')) {
            setUser(userData);
          } else {
            setUser(null);
          }
        }
      } catch (error: any) {
        // No cookie or invalid cookie - user is not authenticated
        // This is expected after logout or on login page, so only log in development
        if (mounted) {
          if (!isLoginPage && error.response?.status !== 429) {
            // Don't log 429 errors (rate limiting) - they're expected during development
            import('./utils/safeLogger').then(({ safeLog }) => {
              safeLog('User not authenticated (expected after logout)', { status: error.response?.status });
            });
          }
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Small delay to prevent rapid-fire requests on hot reload
    timeoutId = setTimeout(() => {
      loadUser();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Get default redirect page based on user permissions
  const getDefaultPage = () => {
    if (!user) return '/login';
    if (user.role === 'admin' || user.permissions?.canViewAnalytics) return '/';
    if (user.permissions?.canManageOrders) return '/orders';
    if (user.permissions?.canManageProducts) return '/products';
    if (user.permissions?.canManageCategories) return '/categories';
    return '/settings'; // Everyone can access settings
  };

  const handleLogout = async () => {
    // Clear user state immediately to prevent redirect loops
    setUser(null);
    
    // SECURITY: Clear all caches to prevent data leakage after logout
    // 1. Clear React Query cache (all API response data)
    queryClient.clear();
    
    // 2. Clear localStorage (user preferences, cached data)
    try {
      localStorage.clear();
    } catch (error) {
      // Silently handle localStorage errors (may fail in private mode)
    }
    
    // 3. Clear sessionStorage (temporary session data)
    try {
      sessionStorage.clear();
    } catch (error) {
      // Silently handle sessionStorage errors (may fail in private mode)
    }
    
    // 4. Clear any IndexedDB caches (if used)
    try {
      if ('indexedDB' in window) {
        // Clear all IndexedDB databases
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            return new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name || '');
              deleteReq.onsuccess = () => resolve(undefined);
              deleteReq.onerror = () => reject(deleteReq.error);
              deleteReq.onblocked = () => resolve(undefined); // Ignore blocked
            });
          })
        );
      }
    } catch (error) {
      // Silently handle IndexedDB errors
    }
    
    // 5. Clear service worker caches (if any)
    try {
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
    } catch (error) {
      // Silently handle cache API errors
    }
    
    try {
      // Phase 2: Cookie-Only - Call logout endpoint to clear httpOnly cookie
      // Backend handles cookie clearing, no localStorage to manage
      await adminService.logout().catch(() => {
        // Silently handle logout errors - state already cleared
      });
    } catch (error) {
      // Silently handle logout errors - state already cleared
    }
    
    // Small delay to ensure all caches are cleared, then redirect
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  // Loading component for Suspense fallback
  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {!user ? (
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login onLogin={setUser} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Suspense>
        ) : (
          <div className="flex min-h-screen">
            <Sidebar onLogout={handleLogout} />
            <main className="flex-1 bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 lg:p-8 overflow-auto min-h-screen">
              <OrderNotificationManager />
              <PasswordExpiryWarning />
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }>
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      user?.role === 'admin' || user?.permissions?.canViewAnalytics 
                        ? <Dashboard /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/products" 
                    element={
                      user?.role === 'admin' || user?.permissions?.canManageProducts 
                        ? <Products /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/orders" 
                    element={
                      user?.role === 'admin' || user?.permissions?.canManageOrders 
                        ? <Orders /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/categories" 
                    element={
                      user?.role === 'admin' || user?.permissions?.canManageCategories 
                        ? <Categories /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/pet-types" 
                    element={
                      user?.role === 'admin' 
                        ? <PetTypes /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/customers" 
                    element={
                      user?.role === 'admin' || user?.permissions?.canManageCustomers 
                        ? <Customers /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/analytics" 
                    element={
                      user?.role === 'admin' || user?.permissions?.canViewAnalytics 
                        ? <Analytics /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={<Settings />} 
                  />
                  <Route 
                    path="/email-templates" 
                    element={
                      user?.role === 'admin' 
                        ? <EmailTemplates /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/slideshow" 
                    element={
                      user?.role === 'admin' 
                        ? <Slideshow /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/blogs" 
                    element={
                      user?.role === 'admin' 
                        ? <Blogs /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/care-guides" 
                    element={
                      user?.role === 'admin' 
                        ? <CareGuides /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route 
                    path="/faqs" 
                    element={
                      user?.role === 'admin' 
                        ? <FAQs /> 
                        : <Navigate to={getDefaultPage()} replace />
                    } 
                  />
                  <Route path="*" element={<Navigate to={getDefaultPage()} replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        )}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;



