import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { trackEmailVerification } from '@/utils/analytics';

const ResendVerification = () => {
  const [searchParams] = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reason = searchParams.get('reason');
  const fromLogin = reason === 'login';

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const response = await api.post('/auth/resend-verification', { email });

      if (response.data.success) {
        setIsSuccess(true);
        trackEmailVerification('resend');
        showToast(response.data.message || 'Verification email sent successfully!', 'success');
      } else {
        showToast(response.data.message || 'Failed to send verification email', 'error');
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
        'Failed to send verification email. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {fromLogin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Email verification required</p>
                <p className="text-amber-700 text-sm mt-1">
                  Please verify your email address before logging in. Check your inbox for the verification link, or resend it below.
                </p>
              </div>
            </div>
          )}
          <div className="text-center mb-6">
            <Mail className="w-12 h-12 mx-auto mb-4 text-primary-600" />
            <h1 className="text-2xl font-bold mb-2">
              {fromLogin ? 'Verify Your Email' : 'Resend Verification Email'}
            </h1>
            <p className="text-gray-600">
              {fromLogin
                ? "We've sent a verification link to your email. Didn't receive it? Enter your email below to resend."
                : "Enter your email address and we'll send you a new verification link."}
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800">
                  Verification email sent! Please check your inbox and click the verification link.
                </p>
              </div>
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Verification Email'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
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
  );
};

export default ResendVerification;

