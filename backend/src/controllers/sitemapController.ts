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

    // Individual product pages - need category info for SEO-friendly URLs
    // Also fetch images for image sitemap
    const productsWithCategory = await Product.find({ 
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    })
      .select('slug updatedAt petType category images name')
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
        
        // Validate slugs - filter out undefined, null, or empty strings
        const isValidSlug = (slug: string) => {
          return slug && 
                 typeof slug === 'string' && 
                 slug.trim() !== '' &&
                 slug.toLowerCase() !== 'undefined' &&
                 slug.toLowerCase() !== 'null';
        };
        
        // Build category path if parent exists
        let categoryPath = '';
        if (isValidSlug(categorySlug)) {
          if (category.parentCategory && typeof category.parentCategory === 'object') {
            const parent = category.parentCategory as any;
            const parentSlug = parent.slug || '';
            if (isValidSlug(parentSlug)) {
              categoryPath = `${parentSlug}/${categorySlug}`;
            } else {
              categoryPath = categorySlug;
            }
          } else {
            categoryPath = categorySlug;
          }
        }
        
        // Only use SEO-friendly URL if we have valid category path and pet type
        if (categoryPath && isValidSlug(petTypeSlug) && isValidSlug(product.slug || '')) {
          productUrl = `${baseUrl}/${petTypeSlug}/${categoryPath}/${product.slug}`;
        }
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

