import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import SEO from '@/components/SEO';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email')?.trim() || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(email ? 'loading' : 'error');
  const [message, setMessage] = useState(email ? '' : 'Missing email. Use the unsubscribe link from your Petshiwu email.');

  useEffect(() => {
    if (!email) return;

    const run = async () => {
      try {
        const response = await api.get('/v1/newsletter/unsubscribe', {
          params: { email },
          skipAuth: true,
        });
        if (response.data?.success !== false) {
          setStatus('success');
          setMessage(response.data?.message || "You've been removed from Petshiwu email updates.");
        } else {
          setStatus('error');
          setMessage(response.data?.message || 'Could not unsubscribe. Email support@petshiwu.com');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Could not unsubscribe. Email support@petshiwu.com');
      }
    };

    run();
  }, [email]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <SEO
        title="Unsubscribe | Petshiwu"
        description="Unsubscribe from Petshiwu delivery update emails."
        url="/unsubscribe"
      />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#1E3A8A] animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Unsubscribing</h1>
            <p className="text-gray-600">Removing {email} from delivery updates…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2">Unsubscribed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/"
              className="inline-block bg-[#1E3A8A] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1E40AF] transition-colors"
            >
              Return to Petshiwu
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Could not unsubscribe</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <a href="mailto:support@petshiwu.com" className="text-[#1E3A8A] font-semibold hover:underline">
              support@petshiwu.com
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
