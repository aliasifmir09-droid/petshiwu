import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { trackLogin } from '@/utils/analytics';
import { validateEmail, sanitizeFormData } from '@/utils/inputValidation';
import { extractErrorMessage } from '@/utils/errorHandler';
import SEO from '@/components/SEO';

interface LoginData {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const { toast, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      // Phase 2: Cookie-Only - Login sets httpOnly cookie, no token in response
      // Wrap the login call to handle any token extraction errors gracefully
      try {
        return await authService.login(data);
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
      // Small delay to ensure cookie is set before making authenticated requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const user = await authService.getMe();
      setUser(user);
      
      // Track login
      trackLogin('email');
      
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    },
    onError: (error: any) => {
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
    
    // Validate inputs
    if (!validateEmail(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    
    if (!formData.password || formData.password.length < 1) {
      showToast('Password is required', 'error');
      return;
    }
    
    // Sanitize inputs before sending
    const sanitizedData = sanitizeFormData(formData);
    loginMutation.mutate(sanitizedData);
  };

  const isRegistered = searchParams.get('registered') === 'true';

  return (
    <>
      <SEO
        title="Login - petshiwu"
        description="Sign in to your petshiwu account to access your orders, wishlist, and personalized recommendations."
        url="/login"
        noindex={true}
      />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {isRegistered && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Registration successful!</strong> Please check your email to verify your account before logging in.
            </p>
            <Link
              to="/resend-verification"
              className="text-blue-600 hover:text-blue-700 text-sm font-semibold underline mt-2 inline-block"
            >
              Didn't receive the email? Resend verification
            </Link>
          </div>
        )}

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
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 mr-2" />
                <span className="text-sm">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
    </>
  );
};

export default Login;



