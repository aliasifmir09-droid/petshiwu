import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { AlertTriangle, X, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PasswordExpiryWarning = () => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['user-info'],
    queryFn: () => adminService.getMe(),
    retry: false, // Don't retry on 401 - it's expected if not authenticated
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Reset dismissed state when user data changes
  useEffect(() => {
    setDismissed(false);
  }, [currentUser?.daysUntilPasswordExpires]);

  if (!currentUser || currentUser.role === 'customer') {
    return null;
  }

  const { passwordExpired, daysUntilPasswordExpires } = currentUser;

  // Don't show if dismissed or password is not expiring soon
  if (dismissed || (!passwordExpired && daysUntilPasswordExpires > 7)) {
    return null;
  }

  const isUrgent = passwordExpired || daysUntilPasswordExpires <= 3;

  const getMessage = () => {
    if (passwordExpired) {
      return 'Your password has expired! You must change it now to continue using the system.';
    }
    if (daysUntilPasswordExpires === 0) {
      return 'Your password expires today! Please change it immediately.';
    }
    if (daysUntilPasswordExpires === 1) {
      return 'Your password expires tomorrow! Please change it soon.';
    }
    return `Your password will expire in ${daysUntilPasswordExpires} days. Please change it soon.`;
  };

  return (
    <>
      {/* Banner Warning */}
      <div
        className={`${
          isUrgent
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        } border-l-4 ${
          isUrgent ? 'border-l-red-600' : 'border-l-amber-600'
        } p-4 mb-6 rounded-r-lg shadow-sm`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 ${
              isUrgent ? 'text-red-600' : 'text-amber-600'
            }`}
          >
            {isUrgent ? <Lock size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div className="flex-1">
            <h3
              className={`font-semibold ${
                isUrgent ? 'text-red-900' : 'text-amber-900'
              }`}
            >
              {passwordExpired ? 'Password Expired' : 'Password Expiring Soon'}
            </h3>
            <p
              className={`mt-1 text-sm ${
                isUrgent ? 'text-red-700' : 'text-amber-700'
              }`}
            >
              {getMessage()}
            </p>
            <p
              className={`mt-2 text-xs ${
                isUrgent ? 'text-red-600' : 'text-amber-600'
              }`}
            >
              <strong>Security Policy:</strong> Dashboard users must change
              their password every 30 days for security reasons.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => navigate('/settings?tab=password')}
                className={`${
                  isUrgent
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                } text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2`}
              >
                <Lock size={16} />
                Change Password Now
              </button>
              {!passwordExpired && (
                <button
                  onClick={() => setDismissed(true)}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Remind Me Later
                </button>
              )}
            </div>
          </div>
          {!passwordExpired && (
            <button
              onClick={() => setDismissed(true)}
              className={`flex-shrink-0 ${
                isUrgent
                  ? 'text-red-400 hover:text-red-600'
                  : 'text-amber-400 hover:text-amber-600'
              } transition-colors`}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Force Change Modal - Only if password is expired */}
      {passwordExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 bg-red-100 p-3 rounded-full">
                <Lock size={24} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-900">
                Password Expired
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              Your password has expired and must be changed immediately. This is
              a security requirement for all dashboard users.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>Security Policy:</strong> Passwords must be changed
                every 30 days to maintain system security.
              </p>
            </div>
            <button
              onClick={() => navigate('/settings?tab=password')}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Lock size={18} />
              Change Password Now
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PasswordExpiryWarning;

