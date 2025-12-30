import { AlertTriangle, Download } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { UI } from '@/utils/dashboardConstants';
import { MonthlySale } from '@/pages/Dashboard';
import { exportSalesData } from '@/utils/exportUtils';
import HelpIcon from '@/components/dashboard/HelpIcon';

interface SalesChartProps {
  salesData: MonthlySale[];
  previousPeriodSalesData: MonthlySale[];
  orderStatsLoading: boolean;
  orderStatsError: Error | null;
  showComparison: boolean;
  dateRange: '7d' | '30d' | '3m' | '6m' | '1y';
  onShowComparisonChange: (show: boolean) => void;
  onDateRangeChange: (range: '7d' | '30d' | '3m' | '6m' | '1y') => void;
  onExportSuccess: (message: string) => void;
}

const SalesChart = ({
  salesData,
  previousPeriodSalesData,
  orderStatsLoading,
  orderStatsError,
  showComparison,
  dateRange,
  onShowComparisonChange,
  onDateRangeChange,
  onExportSuccess,
}: SalesChartProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all hover-lift animate-fade-in-up" role="region" aria-label="Sales overview chart">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-gray-900">Sales Overview</h2>
          <HelpIcon 
            content="This chart shows your sales revenue over time. Use the date range selector to view different periods. Enable comparison mode to compare with the previous period."
            position="right"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => onShowComparisonChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>Compare with previous period</span>
          </label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value as '7d' | '30d' | '3m' | '6m' | '1y')}
            className="bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-lg text-sm font-bold text-blue-800 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            aria-label="Time period"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={() => {
              exportSalesData(salesData);
              onExportSuccess('Sales data exported successfully');
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            title="Export sales data to CSV"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      {orderStatsLoading ? (
        <div className="h-[300px] animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-full bg-gray-100 rounded"></div>
        </div>
      ) : orderStatsError ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center text-red-600">
            <AlertTriangle className="mx-auto mb-2" size={32} />
            <p>Failed to load sales data</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={UI.CHART_HEIGHT} className="min-h-[250px] sm:min-h-[300px]">
          <LineChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              width={60}
            />
            <Tooltip 
              formatter={(value: unknown, _: string, props: { payload?: { previousSales?: number } }) => {
                const currentValue = Number(value) || 0;
                const previousValue = props.payload?.previousSales || 0;
                const change = previousValue > 0 
                  ? ((currentValue - previousValue) / previousValue * 100).toFixed(1)
                  : null;
                const totalSales = salesData.reduce((sum: number, item: MonthlySale) => sum + (item.sales || 0), 0);
                const percentageOfTotal = totalSales > 0
                  ? ((currentValue / totalSales) * 100).toFixed(1)
                  : null;
                
                let tooltipText = `$${currentValue.toFixed(2)}`;
                if (change) {
                  const changeSymbol = Number(change) >= 0 ? '↑' : '↓';
                  tooltipText += `\n${changeSymbol} ${Math.abs(Number(change))}% vs previous period`;
                }
                if (percentageOfTotal) {
                  tooltipText += `\n${percentageOfTotal}% of total`;
                }
                
                return [tooltipText, 'Sales'];
              }}
              contentStyle={{ 
                fontSize: '12px',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                whiteSpace: 'pre-line'
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#0284c7" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Current Period"
            />
            {showComparison && previousPeriodSalesData.length > 0 && (
              <Line 
                type="monotone" 
                dataKey="previousSales" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Previous Period"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SalesChart;

