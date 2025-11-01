import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { adminService } from './services/adminService';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Categories from './pages/Categories';
import PetTypes from './pages/PetTypes';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Customers from './pages/Customers';
import Login from './pages/Login';
import PasswordExpiryWarning from './components/PasswordExpiryWarning';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Refetch when window regains focus for better sync
      retry: 1,
      staleTime: 30000, // Data considered fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes (formerly cacheTime)
    }
  }
});

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const userData = await adminService.getMe();
          
          if (userData && (userData.role === 'admin' || userData.role === 'staff')) {
            setUser(userData);
          } else {
            localStorage.removeItem('adminToken');
          }
        } catch (error) {
          localStorage.removeItem('adminToken');
        }
      }
      setLoading(false);
    };

    loadUser();
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
    try {
      await adminService.logout();
    } catch (error) {
      // Silently handle logout errors
    }
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {!user ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={setUser} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        ) : (
          <div className="flex flex-col min-h-screen">
            <Header onLogout={handleLogout} />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 lg:p-8 overflow-auto">
                <PasswordExpiryWarning />
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
                <Route path="*" element={<Navigate to={getDefaultPage()} replace />} />
                </Routes>
              </main>
            </div>
          </div>
        )}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;



