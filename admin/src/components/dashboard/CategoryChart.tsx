import { memo, useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { UI, CHART_MARGINS } from '@/utils/dashboardConstants';
import HelpIcon from '@/components/dashboard/HelpIcon';

interface CategoryChartData {
  name: string;
  value: number;
}

interface CategoryChartProps {
  categoryData: CategoryChartData[];
  categoriesLoading: boolean;
  categoryViewMode: 'subcategories' | 'products' | 'revenue';
  onViewModeChange: (mode: 'subcategories' | 'products' | 'revenue') => void;
}

const CategoryChart = memo(({
  categoryData,
  categoriesLoading,
  categoryViewMode,
  onViewModeChange,
}: CategoryChartProps) => {
  const handleViewModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onViewModeChange(e.target.value as 'subcategories' | 'products');
  }, [onViewModeChange]);

  // PERFORMANCE FIX: Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    if (!categoryData || categoryData.length === 0) return [];
    return categoryData;
  }, [categoryData]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all hover-lift animate-fade-in-up" role="region" aria-label="Category distribution chart">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-gray-900">Navigation Menu Categories</h2>
          <HelpIcon 
            content="This chart displays category distribution. Switch between subcategory count, product count, or revenue views using the dropdown."
            position="right"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={categoryViewMode}
            onChange={handleViewModeChange}
            className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-lg text-sm font-bold text-green-800 border-0 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            aria-label="Category view mode"
          >
            <option value="subcategories">Subcategory Count</option>
            <option value="products">Product Count</option>
          </select>
        </div>
      </div>
      {categoriesLoading ? (
        <div className="h-[300px] animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-full bg-gray-100 rounded"></div>
        </div>
      ) : categoryData.length === 0 || (categoryData.length === 1 && categoryData[0].name === 'Loading...') ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-500">No categories found</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={UI.CHART_HEIGHT} className="min-h-[250px] sm:min-h-[300px]">
          <BarChart data={chartData} margin={{ top: CHART_MARGINS.TOP, right: CHART_MARGINS.RIGHT, left: CHART_MARGINS.LEFT, bottom: CHART_MARGINS.BOTTOM }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: '11px', fontWeight: 'bold' }}
              tick={{ fill: '#6b7280' }}
              interval={0}
            />
            <YAxis 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              width={60}
              label={{ 
                value: categoryViewMode === 'subcategories' ? 'Subcategories' : 'Products', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fontSize: '11px' } 
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '2px solid #3b82f6', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value: unknown) => {
                const label = categoryViewMode === 'subcategories' ? 'subcategories' : 'products';
                return [`${value} ${label}`, 'Count'];
              }}
            />
            <Bar 
              dataKey="value" 
              fill="url(#colorGradient)" 
              radius={[8, 8, 0, 0]}
              label={{ position: 'top', formatter: (value: unknown) => `${value}` }}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

CategoryChart.displayName = 'CategoryChart';

export default CategoryChart;

