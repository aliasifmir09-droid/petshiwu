import { useNavigate } from 'react-router-dom';
import { ShieldAlert, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import SEO from '@/components/SEO';

const Forbidden = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <>
      <SEO
        title="403 - Access Forbidden"
        description="You don't have permission to access this page."
        url="/403"
        noindex={true}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="text-yellow-600" size={48} />
            </div>
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-black text-gray-900 mb-4">403</h1>

          {/* Error Message */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Access Forbidden
          </h2>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please sign in or contact support if you believe this is an error.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              Refresh Page
            </button>

            <button
              onClick={handleGoBack}
              className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>

            <button
              onClick={handleGoHome}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Return to Home
            </button>
          </div>
        </div>

        {/* Additional Help */}
        <p className="mt-6 text-sm text-gray-500">
          If you believe you should have access, please contact support.
        </p>
      </div>
    </div>
    </>
  );
};

export default Forbidden;

