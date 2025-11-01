import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Layers,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar = ({ onLogout }: SidebarProps) => {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Get user info and permissions
  const { data: userData } = useQuery({
    queryKey: ['user-info'],
    queryFn: () => adminService.getMe()
  });

  // Get out-of-stock product count
  const { data: outOfStockData } = useQuery({
    queryKey: ['products', 'out-of-stock-count'],
    queryFn: () => adminService.getProducts({ inStock: false, limit: 1 }),
    refetchInterval: 60000 // Refetch every minute
  });

  const outOfStockCount = outOfStockData?.pagination?.total || 0;
  const isAdmin = userData?.role === 'admin';

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', permission: 'canViewAnalytics' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', permission: 'canViewAnalytics' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders', permission: 'canManageOrders' },
    { path: '/products', icon: Package, label: 'Products', badge: outOfStockCount, permission: 'canManageProducts' },
    { path: '/categories', icon: FolderTree, label: 'Categories', permission: 'canManageCategories' },
    { path: '/pet-types', icon: Layers, label: 'Pet Types', adminOnly: true },
    { path: '/customers', icon: Users, label: 'Customers', permission: 'canManageCustomers' },
    { path: '/settings', icon: Settings, label: 'Settings', alwaysShow: true }
  ];

  // Check if user has permission for a menu item
  const hasPermission = (item: any) => {
    if (item.alwaysShow) return true;
    if (item.adminOnly) return isAdmin;
    if (!item.permission) return true;
    
    // Admins have all permissions
    if (isAdmin) return true;
    
    // Check staff permissions
    return userData?.permissions?.[item.permission] === true;
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white h-screen flex flex-col shadow-2xl relative overflow-hidden sticky top-0">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 opacity-10 rounded-full blur-3xl"></div>
      
      {/* Logo */}
      <div className="p-6 border-b border-white/20 relative z-10">
        <Link to="/" className="flex items-center gap-3 mb-1 group">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="petshiwu Logo" 
              className="h-16 w-16 lg:h-20 lg:w-20 object-contain transform group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 drop-shadow-2xl relative z-10"
            />
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <span className="text-2xl font-black text-white tracking-tight group-hover:tracking-wide transition-all duration-300 relative" style={{ fontFamily: "'Pacifico', cursive" }}>
            petshiwu
            {/* Underline animation */}
            <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-yellow-300 to-pink-300 group-hover:w-full transition-all duration-500 rounded-full"></span>
          </span>
        </Link>
        <p className="text-xs text-blue-200 ml-20 mt-1">Admin Dashboard</p>
        {userData && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-sm text-white font-semibold">
              {userData.firstName} {userData.lastName}
            </p>
            <p className="text-xs text-blue-200 mt-1">
              {userData.role === 'admin' ? '👑 Super Admin' : '👤 Staff Member'}
            </p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 relative z-10 overflow-y-auto scrollbar-hide">
        <ul className="space-y-2">
          {menuItems.map((item: any) => {
            // Check if user has permission to see this menu item
            if (!hasPermission(item)) {
              return null;
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path} className="animate-fade-in-up">
                <Link
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-[#1E3A8A] shadow-xl transform scale-105 font-bold'
                      : 'text-white/90 hover:bg-white/10 hover:text-white hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isActive ? 'text-[#1E3A8A]' : ''} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center ${
                      isActive 
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white' 
                        : 'bg-gradient-to-r from-red-500 to-pink-600 text-white animate-pulse-slow'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          
          {/* Logout - After Settings */}
          <li className="animate-fade-in-up mt-2">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white w-full transition-all duration-300 hover:shadow-lg font-medium"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>

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
    </aside>
  );
};

export default Sidebar;



