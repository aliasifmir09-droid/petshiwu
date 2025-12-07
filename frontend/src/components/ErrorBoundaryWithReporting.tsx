import { Component, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

/**
 * Enhanced Error Boundary with error reporting and better UX
 */
class ErrorBoundaryWithReporting extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error without sensitive data - only in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error.message);
    }
    
    // Store error info for display (only in development)
    if (import.meta.env.DEV) {
      this.setState({ errorInfo });
    } else {
      // In production, don't store errorInfo to avoid data leakage
      this.setState({ errorInfo: null });
    }
    
    // Report error to analytics (if available)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
      });
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // In production, you could send to error tracking service (e.g., Sentry)
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-red-800 mb-2">Error Details:</p>
                <p className="text-sm text-red-700 font-mono break-all">
                  {this.state.error.message || 'Unknown error occurred'}
                </p>
                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                      Stack Trace (Dev Only)
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                <RefreshCw size={18} />
                Reload Page
              </button>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                <Home size={18} />
                Go Home
              </Link>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              If this problem persists, please contact our support team.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWithReporting;

