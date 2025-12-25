import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import Blog from '../models/Blog';
import CareGuide from '../models/CareGuide';
import FAQ from '../models/FAQ';
import PetType from '../models/PetType';
import logger from '../utils/logger';

/**
 * Generate XML sitemap dynamically
 * GET /api/sitemap.xml
 */
export const generateSitemap = async (req: Request, res: Response) => {
  try {
    const baseUrl = 'https://www.petshiwu.com';
    const currentDate = new Date().toISOString().split('T')[0];

    // Note: Products are fetched later with category info for SEO-friendly URLs

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

    // Fetch all published care guides
    const careGuides = await CareGuide.find({ 
      isPublished: true 
    })
      .select('slug updatedAt')
      .lean();

    // Fetch all active FAQs
    const faqs = await FAQ.find({ 
      isActive: true 
    })
      .select('_id updatedAt')
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

    // Pet type pages - fetch from database for dynamic pet types
    const petTypes = await PetType.find({ isActive: true })
      .select('slug updatedAt')
      .lean();
    
    petTypes.forEach(petType => {
      // SEO-friendly URL: /petType instead of /products?petType=...
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/${petType.slug}</loc>\n`;
      const lastmod = petType.updatedAt 
        ? new Date(petType.updatedAt).toISOString().split('T')[0]
        : currentDate;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
      
      // Also include legacy query param URL for backward compatibility
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/products?petType=${petType.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    // Individual product pages - need category info for SEO-friendly URLs
    const productsWithCategory = await Product.find({ 
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    })
      .select('slug updatedAt petType category')
      .populate('category', 'slug parentCategory')
      .sort({ updatedAt: -1 })
      .limit(10000)
      .lean();

    productsWithCategory.forEach(product => {
      const lastmod = product.updatedAt 
        ? new Date(product.updatedAt).toISOString().split('T')[0]
        : currentDate;
      
      // Generate SEO-friendly URL: /petType/categoryPath/product-slug
      // Fallback to /products/slug if category info not available
      let productUrl = `${baseUrl}/products/${product.slug}`;
      
      if (product.petType && product.category && typeof product.category === 'object') {
        const category = product.category as any;
        const categorySlug = category.slug || '';
        const petTypeSlug = product.petType;
        
        // Build category path if parent exists
        let categoryPath = categorySlug;
        if (category.parentCategory && typeof category.parentCategory === 'object') {
          const parent = category.parentCategory as any;
          categoryPath = `${parent.slug}/${categorySlug}`;
        }
        
        if (categoryPath && petTypeSlug) {
          productUrl = `${baseUrl}/${petTypeSlug}/${categoryPath}/${product.slug}`;
        }
      }
      
      xml += '  <url>\n';
      xml += `    <loc>${productUrl}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
      
      // Also include legacy /products/slug URL for backward compatibility
      if (productUrl !== `${baseUrl}/products/${product.slug}`) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      }
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

    // Blog/Learning pages
    blogs.forEach(blog => {
      const lastmod = blog.updatedAt 
        ? new Date(blog.updatedAt).toISOString().split('T')[0]
        : currentDate;
      
      // SEO-friendly URL: /learning/slug
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/learning/${blog.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    });

    // Care guide pages
    careGuides.forEach(guide => {
      const lastmod = guide.updatedAt 
        ? new Date(guide.updatedAt).toISOString().split('T')[0]
        : currentDate;
      
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/care-guides/${guide.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    });

    // Learning/Care Guides index pages
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/learning</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/care-guides</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    // Search page
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/search</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    // Static pages
    const staticPages = [
      { path: '/faq', priority: '0.6', changefreq: 'monthly' },
      { path: '/returns', priority: '0.5', changefreq: 'monthly' },
      { path: '/donate', priority: '0.4', changefreq: 'monthly' },
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

