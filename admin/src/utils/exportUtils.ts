/**
 * Export utilities for downloading dashboard data as CSV
 */

/**
 * Converts data to CSV format
 */
export const convertToCSV = (data: any[], headers: string[]): string => {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  const csvRows: string[] = [];
  
  // Add headers
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] ?? '';
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

/**
 * Downloads data as CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Exports order statistics to CSV
 */
export const exportOrderStats = (orderStats: any): void => {
  if (!orderStats) return;
  
  const data = [
    {
      'Total Orders': orderStats.totalOrders ?? 0,
      'Pending Orders': orderStats.pendingOrders ?? 0,
      'Processing Orders': orderStats.processingOrders ?? 0,
      'Shipped Orders': orderStats.shippedOrders ?? 0,
      'Delivered Orders': orderStats.deliveredOrders ?? 0,
      'Total Revenue': `$${(orderStats.totalRevenue ?? 0).toFixed(2)}`,
      'Revenue Trend': orderStats.revenueTrend ? `${orderStats.revenueTrend.toFixed(1)}%` : 'N/A',
      'Orders Trend': orderStats.ordersTrend ? `${orderStats.ordersTrend.toFixed(1)}%` : 'N/A',
    }
  ];
  
  const headers = ['Total Orders', 'Pending Orders', 'Processing Orders', 'Shipped Orders', 'Delivered Orders', 'Total Revenue', 'Revenue Trend', 'Orders Trend'];
  const csv = convertToCSV(data, headers);
  const filename = `order-stats-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
};

/**
 * Exports product statistics to CSV
 */
export const exportProductStats = (productStats: any): void => {
  if (!productStats) return;
  
  const data = [
    {
      'Total Products': productStats.totalProducts ?? 0,
      'Out of Stock Products': productStats.outOfStockProducts ?? 0,
      'Featured Products': productStats.featuredProducts ?? 0,
    }
  ];
  
  const headers = ['Total Products', 'Out of Stock Products', 'Featured Products'];
  const csv = convertToCSV(data, headers);
  const filename = `product-stats-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
};

/**
 * Exports recent orders to CSV
 */
export const exportRecentOrders = (orders: any[]): void => {
  if (!orders || orders.length === 0) return;
  
  const data = orders.map(order => ({
    'Order Number': order.orderNumber || order._id || 'N/A',
    'Customer': `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Guest',
    'Total': `$${(order.totalPrice ?? 0).toFixed(2)}`,
    'Status': order.orderStatus || 'Unknown',
    'Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
  }));
  
  const headers = ['Order Number', 'Customer', 'Total', 'Status', 'Date'];
  const csv = convertToCSV(data, headers);
  const filename = `recent-orders-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
};

/**
 * Exports sales chart data to CSV
 */
export const exportSalesData = (salesData: any[]): void => {
  if (!salesData || salesData.length === 0) return;
  
  const data = salesData.map(sale => ({
    'Month': sale.month || 'N/A',
    'Sales': `$${(sale.sales ?? 0).toFixed(2)}`,
    'Order Count': sale.orderCount ?? 0,
  }));
  
  const headers = ['Month', 'Sales', 'Order Count'];
  const csv = convertToCSV(data, headers);
  const filename = `sales-data-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
};

/**
 * Exports out-of-stock products to CSV
 */
export const exportOutOfStockProducts = (products: any[]): void => {
  if (!products || products.length === 0) return;
  
  const data = products.map(product => ({
    'Product Name': product.name || 'N/A',
    'Brand': product.brand || 'N/A',
    'Stock': product.totalStock ?? 0,
  }));
  
  const headers = ['Product Name', 'Brand', 'Stock'];
  const csv = convertToCSV(data, headers);
  const filename = `out-of-stock-products-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
};

