import { Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { stringify } from 'csv-stringify/sync';
import logger from '../utils/logger';

/**
 * Export orders to CSV
 */
export const exportOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .lean();

    // Prepare CSV data
    const csvData = orders.map(order => ({
      'Order ID': order._id?.toString() || '',
      'Order Number': order.orderNumber || '',
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Customer Name': `${(order.user as any)?.firstName || ''} ${(order.user as any)?.lastName || ''}`.trim(),
      'Customer Email': (order.user as any)?.email || '',
      'Customer Phone': (order.user as any)?.phone || '',
      'Status': order.orderStatus,
      'Payment Status': order.paymentStatus,
      'Items Count': order.items.length,
      'Items Price': order.itemsPrice.toFixed(2),
      'Shipping Price': order.shippingPrice.toFixed(2),
      'Tax Price': order.taxPrice.toFixed(2),
      'Donation Amount': (order.donationAmount || 0).toFixed(2),
      'Total Price': order.totalPrice.toFixed(2),
      'Shipping Address': `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
      'Payment Method': order.paymentMethod,
      'Notes': order.notes || ''
    }));

    const csv = stringify(csvData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error: any) {
    logger.error('Error exporting orders:', error);
    next(error);
  }
};

/**
 * Export products to CSV
 */
export const exportProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { includeInactive = 'false' } = req.query;

    const query: any = {};
    if (includeInactive === 'false') {
      query.isActive = true;
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Prepare CSV data
    const csvData = products.map(product => ({
      'Product ID': product._id?.toString() || '',
      'Name': product.name,
      'Slug': product.slug,
      'Brand': product.brand,
      'Category': (product.category as any)?.name || '',
      'Pet Type': product.petType,
      'Description': product.description.replace(/\n/g, ' ').substring(0, 500),
      'Base Price': product.basePrice.toFixed(2),
      'Compare At Price': product.compareAtPrice?.toFixed(2) || '',
      'Total Stock': product.totalStock,
      'In Stock': product.inStock ? 'Yes' : 'No',
      'Is Active': product.isActive ? 'Yes' : 'No',
      'Is Featured': product.isFeatured ? 'Yes' : 'No',
      'Average Rating': product.averageRating.toFixed(2),
      'Total Reviews': product.totalReviews,
      'Tags': product.tags.join(', '),
      'Images': product.images.join(', '),
      'Created At': new Date(product.createdAt).toISOString()
    }));

    const csv = stringify(csvData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error: any) {
    logger.error('Error exporting products:', error);
    next(error);
  }
};

/**
 * Export customers to CSV
 */
export const exportCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role = 'customer' } = req.query;

    const users = await User.find({ role })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Get order statistics for each customer
    const customersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ user: user._id }).lean();
        const totalSpent = orders
          .filter(o => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.totalPrice, 0);
        const orderCount = orders.length;

        return {
          'Customer ID': user._id?.toString() || '',
          'First Name': user.firstName || '',
          'Last Name': user.lastName || '',
          'Email': user.email,
          'Phone': user.phone || '',
          'Role': user.role,
          'Is Active': user.isActive ? 'Yes' : 'No',
          'Email Verified': user.emailVerified ? 'Yes' : 'No',
          'Total Orders': orderCount,
          'Total Spent': totalSpent.toFixed(2),
          'Average Order Value': orderCount > 0 ? (totalSpent / orderCount).toFixed(2) : '0.00',
          'Created At': new Date(user.createdAt).toISOString(),
          'Last Login': user.lastLogin ? new Date(user.lastLogin).toISOString() : 'Never'
        };
      })
    );

    const csv = stringify(customersWithStats, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error: any) {
    logger.error('Error exporting customers:', error);
    next(error);
  }
};

