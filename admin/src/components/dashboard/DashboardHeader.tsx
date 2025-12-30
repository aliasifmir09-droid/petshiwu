import { RefreshCw, Clock, Moon, Sun } from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';
import { UI } from '@/utils/dashboardConstants';

interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const DashboardHeader = ({ onRefresh, isRefreshing, lastUpdated, isDarkMode, onToggleDarkMode }: DashboardHeaderProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-xl">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 animate-fade-in-up">
              Dashboard Overview
            </h1>
            <p className="text-blue-100 text-lg animate-fade-in-up">
              Welcome back! Here's what's happening with your store today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDarkMode}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={UI.ICON_SIZE_MEDIUM} /> : <Moon size={UI.ICON_SIZE_MEDIUM} />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw size={UI.ICON_SIZE_MEDIUM} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-blue-100 text-sm mt-2">
            <Clock size={UI.ICON_SIZE_SMALL} />
            <span>Last updated: {formatDateTime(lastUpdated)}</span>
          </div>
        )}
      </div>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 opacity-10 rounded-full blur-3xl"></div>
    </div>
  );
};

export default DashboardHeader;

