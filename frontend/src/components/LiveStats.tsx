import { Users, Package, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

const LiveStats = () => {
  const [stats, setStats] = useState({
    usersOnline: 247,
    recentPurchases: 18,
    todaySales: 1543
  });

  // Simulate live updates (in real app, this would come from backend)
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        usersOnline: Math.max(100, prev.usersOnline + Math.floor(Math.random() * 10) - 5),
        recentPurchases: prev.recentPurchases + Math.floor(Math.random() * 2),
        todaySales: prev.todaySales + Math.floor(Math.random() * 5)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
          {/* Users Online */}
          <div className="flex items-center gap-2 animate-fade-in-left">
            <Users size={18} className="animate-pulse" />
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stats.usersOnline}</span>
              <span className="text-sm opacity-90">shoppers online</span>
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="flex items-center gap-2 animate-fade-in-up">
            <Package size={18} className="animate-bounce-slow" />
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stats.recentPurchases}</span>
              <span className="text-sm opacity-90">purchases in last hour</span>
            </div>
          </div>

          {/* Today's Sales */}
          <div className="flex items-center gap-2 animate-fade-in-right">
            <TrendingUp size={18} />
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stats.todaySales}</span>
              <span className="text-sm opacity-90">happy customers today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;

