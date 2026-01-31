import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/utils/errorHandler';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const { toast, showToast, hideToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      // Phase 2: Cookie-Only - Login sets httpOnly cookie, no token in response
      // Wrap the login call to handle any token extraction errors gracefully
      try {
        return await adminService.login(formData.email, formData.password);
      } catch (error: any) {
        // If error is about missing token, that's expected in Phase 2 (cookie-only)
        // The cookie is set automatically, so we can ignore token extraction errors
        if (error?.message?.includes('token') || error?.message?.includes('Token')) {
          // Cookie was set, just return success response structure
          return { success: true };
        }
        throw error;
      }
    },
    onSuccess: async () => {
      try {
        // Increased delay to ensure cookie is fully set and propagated before making authenticated requests
        // This prevents 401 errors that occur when queries run before authentication is confirmed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Retry logic: Try to fetch user info with retries in case cookie isn't ready yet
        let user = null;
        let retries = 3;
        while (!user && retries > 0) {
          try {
            user = await adminService.getMe();
            if (user) break;
          } catch (error: any) {
            retries--;
            if (retries > 0) {
              // Wait a bit longer before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              throw error;
            }
          }
        }
        
        if (!user) {
          showToast('Error fetching user information. Please try again.', 'error');
          return;
        }
        
        if (user.role !== 'admin' && user.role !== 'staff') {
          showToast('Access denied. Admin or staff account required.', 'error');
          return;
        }
        
        onLogin(user);
        
        // Don't prefetch here - let the Dashboard component handle it after authentication is confirmed
        // This prevents queries from running before the cookie is fully ready
        
        // Force reload to ensure App.tsx picks up the user and clears any stale state
        window.location.href = '/';
      } catch (error: any) {
        // Use safe error logging to prevent data leakage
        const { safeError } = await import('@/utils/safeLogger');
        safeError('Error after login', error);
        // Extract proper error message (handles rate limiting and other errors)
        const errorMessage = extractErrorMessage(error);
        showToast(errorMessage, 'error');
      }
    },
    onError: (error: any) => {
      // Use safe error logging to prevent data leakage
      import('@/utils/safeLogger').then(({ safeError }) => {
        safeError('Login error', error);
      });
      // Don't show error if it's just about missing token (expected in Phase 2)
      if (!error?.message?.includes('token') && !error?.message?.includes('Token')) {
        // Extract proper error message (handles rate limiting and other errors)
        const errorMessage = extractErrorMessage(error);
        showToast(errorMessage, 'error');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src="/logo.png" 
              alt="Petshiwu Logo" 
              className="h-20 w-20 object-contain drop-shadow-lg"
            />
            <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-primary-600 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              petshiwu
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Admin Dashboard</p>
          <p className="text-gray-500 text-sm">Sign in to continue</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Access Information:</p>
            <p className="text-sm text-blue-700">Enter your admin credentials to access the dashboard</p>
            <p className="text-sm text-gray-500 mt-1">Note: Staff accounts can be created by administrators in Settings</p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};

export default Login;



