import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import Blog from '../models/Blog';
import CareGuide from '../models/CareGuide';
import FAQ from '../models/FAQ';
import PetType from '../models/PetType';
import logger from '../utils/logger';

/**
 * Escape XML special characters
 */
const escapeXml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Generate XML sitemap dynamically
 * GET /api/sitemap.xml
 */
const getBaseUrl = (): string => {
  return process.env.FRONTEND_URL || process.env.SITE_URL || process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'https://www.petshiwu.com';
};

export const generateSitemap = async (req: Request, res: Response) => {
  try {
    const baseUrl = getBaseUrl().replace(/\/$/, '');
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

    // Note: /products?featured=true removed — query-string URLs redirect and waste crawl budget.

    // Pet type pages - fetch from database for dynamic pet types
    const petTypes = await PetType.find({ isActive: true })
      .select('slug updatedAt')
      .lean();
    
    petTypes.forEach(petType => {
      // SEO-friendly canonical URL: /petType
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/${petType.slug}</loc>\n`;
      const lastmod = petType.updatedAt 
        ? new Date(petType.updatedAt).toISOString().split('T')[0]
        : currentDate;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Individual product pages
    // URL format must exactly match the canonical URLs served by botRenderer:
    //   /{petType}/{category.slug}/{productSlug}
    // Using only the immediate category slug (not full hierarchy) to stay consistent.
    const productsWithCategory = await Product.find({
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    })
      .select('slug updatedAt petType category images name')
      .populate({ path: 'category', select: 'slug' })
      .sort({ updatedAt: -1 })
      .limit(10000)
      .lean();

    const isValidSlug = (slug: unknown): slug is string => {
      if (slug == null || typeof slug !== 'string') return false;
      const s = String(slug).trim();
      if (s === '') return false;
      const lower = s.toLowerCase();
      return lower !== 'undefined' && lower !== 'null';
    };

    productsWithCategory.forEach(product => {
      const lastmod = product.updatedAt
        ? new Date(product.updatedAt).toISOString().split('T')[0]
        : currentDate;

      // Mirror botRenderer canonical exactly: /{petType}/{categorySlug}/{productSlug}
      const categorySlug = (product.category && typeof product.category === 'object')
        ? (product.category as any).slug
        : undefined;

      let productUrl = `${baseUrl}/products/${product.slug}`;
      if (isValidSlug(product.petType) && isValidSlug(categorySlug) && isValidSlug(product.slug)) {
        productUrl = `${baseUrl}/${product.petType}/${categorySlug}/${product.slug}`;
      }
      
      xml += '  <url>\n';
      xml += `    <loc>${productUrl}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      
      // Add product images to sitemap for better SEO
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Include up to 5 images per product (Google's limit)
        const imagesToInclude = product.images.slice(0, 5);
        imagesToInclude.forEach((image: any) => {
          if (image) {
            const imageUrl = typeof image === 'string' ? image : (image.url || image);
            if (imageUrl && imageUrl.trim() !== '') {
              xml += '    <image:image>\n';
              xml += `      <image:loc>${imageUrl}</image:loc>\n`;
              if (product.name) {
                xml += `      <image:title>${escapeXml(product.name)}</image:title>\n`;
              }
              xml += '    </image:image>\n';
            }
          }
        });
      }
      
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
      { path: '/about', priority: '0.7', changefreq: 'monthly' },
      { path: '/faq', priority: '0.6', changefreq: 'monthly' },
      { path: '/returns', priority: '0.5', changefreq: 'monthly' },
      { path: '/donate', priority: '0.4', changefreq: 'monthly' },
      // SEO landing pages — existing
      { path: '/best-dog-food-sensitive-stomach-diarrhea', priority: '0.8', changefreq: 'monthly' },
      { path: '/high-protein-dog-food-picky-eaters', priority: '0.8', changefreq: 'monthly' },
      { path: '/durable-dog-toys-aggressive-chewers', priority: '0.8', changefreq: 'monthly' },
      // NYC local SEO pages — competitor intent + delivery + near me searches
      { path: '/pet-supplies-delivery-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/dog-food-delivery-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/cat-food-delivery-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-store-queens-ny', priority: '0.9', changefreq: 'weekly' },
      { path: '/online-pet-store-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-near-me-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/affordable-pet-food-nyc', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-food-delivery-nyc', priority: '0.9', changefreq: 'weekly' },
      // Business pages
      { path: '/investors', priority: '0.7', changefreq: 'monthly' },
      { path: '/sell-with-us', priority: '0.8', changefreq: 'monthly' },
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

    // Set proper content type with charset for XML
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(xml);
  } catch (error: any) {
    logger.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};

