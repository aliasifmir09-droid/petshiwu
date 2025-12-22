import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import Blog from '../models/Blog';
import logger from '../utils/logger';

/**
 * Generate XML sitemap dynamically
 * GET /api/sitemap.xml
 */
export const generateSitemap = async (req: Request, res: Response) => {
  try {
    const baseUrl = 'https://www.petshiwu.com';
    const currentDate = new Date().toISOString().split('T')[0];

    // Fetch all active products (only slugs for sitemap)
    const products = await Product.find({ 
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10000) // Limit to 10,000 products (sitemap limit)
      .lean();

    // Fetch all active categories
    const categories = await Category.find({ 
      isActive: true 
    })
      .select('slug petType updatedAt')
      .lean();

    // Fetch all published blogs
    const blogs = await Blog.find({ 
      isPublished: true 
    })
      .select('slug updatedAt')
      .lean();

    // Start building XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    // Homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Products page
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/products</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';

    // Featured products
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/products?featured=true</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';

    // Pet type pages
    const petTypes = ['dog', 'cat', 'bird', 'fish', 'reptile', 'small-pet'];
    petTypes.forEach(petType => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/products?petType=${petType}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Individual product pages
    products.forEach(product => {
      const lastmod = product.updatedAt 
        ? new Date(product.updatedAt).toISOString().split('T')[0]
        : currentDate;
      
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Category pages
    categories.forEach(category => {
      const lastmod = category.updatedAt 
        ? new Date(category.updatedAt).toISOString().split('T')[0]
        : currentDate;
      
      const petTypeParam = category.petType && category.petType !== 'all' 
        ? `?petType=${category.petType}` 
        : '';
      
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/category/${category.slug}${petTypeParam}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    // Blog pages
    blogs.forEach(blog => {
      const lastmod = blog.updatedAt 
        ? new Date(blog.updatedAt).toISOString().split('T')[0]
        : currentDate;
      
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/blog/${blog.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    });

    // Static pages
    const staticPages = [
      { path: '/blog', priority: '0.7', changefreq: 'weekly' },
      { path: '/faq', priority: '0.6', changefreq: 'monthly' },
      { path: '/contact', priority: '0.5', changefreq: 'monthly' },
      { path: '/about', priority: '0.5', changefreq: 'monthly' },
    ];

    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    // Set proper content type
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error: any) {
    logger.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};

