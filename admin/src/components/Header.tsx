import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { LogOut, User, ChevronDown } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface HeaderProps {
  onLogout: () => void;
}

const Header = ({ onLogout }: HeaderProps) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get user info
  const { data: userData } = useQuery({
    queryKey: ['user-info'],
    queryFn: () => adminService.getMe()
  });

  return (
    <>
      <header className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] sticky top-0 z-40 shadow-xl w-full">
        <div className="flex items-center justify-between px-6 lg:px-8 py-4">
          {/* Left side - Empty for now, can add breadcrumbs or title later */}
          <div className="flex-1"></div>

          {/* Right side - User menu and logout */}
          <div className="flex items-center gap-4">
            {/* User info dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300 font-medium"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={18} />
                </div>
                <span className="hidden md:block">
                  {userData?.firstName} {userData?.lastName}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {userData?.firstName} {userData?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {userData?.email}
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      {userData?.role === 'admin' ? '👑 Super Admin' : '👤 Staff Member'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You'll need to sign in again to access the admin dashboard."
        confirmText="Logout"
        cancelText="Stay Logged In"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <LogOut className="text-red-600" size={32} />
          </div>
        }
      />
    </>
  );
};

export default Header;

