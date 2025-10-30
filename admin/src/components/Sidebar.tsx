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
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-1">
          <img 
            src="/logo.png" 
            alt="petshiwu Logo" 
            className="h-10 w-10 object-contain drop-shadow-lg"
          />
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent" style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}>
            petshiwu
          </h1>
        </div>
        <p className="text-xs text-gray-400 ml-12">Admin Dashboard</p>
        {userData && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-sm text-gray-300">
              {userData.firstName} {userData.lastName}
            </p>
            <p className="text-xs text-gray-400">
              {userData.role === 'admin' ? '👑 Super Admin' : '👤 Staff Member'}
            </p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item: any) => {
            // Check if user has permission to see this menu item
            if (!hasPermission(item)) {
              return null;
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

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



