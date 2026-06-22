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
      // NYC borough pages
      { path: '/pet-supplies-queens-ny', priority: '1.0', changefreq: 'weekly' },
      { path: '/pet-supplies-brooklyn-ny', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-manhattan-ny', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-bronx-ny', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-staten-island-ny', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-jackson-heights-ny', priority: '1.0', changefreq: 'weekly' },
      // NYC neighborhood pages
      { path: '/pet-supplies-williamsburg-brooklyn-ny', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-park-slope-brooklyn-ny', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-upper-west-side-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-dumbo-brooklyn-ny', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-long-island-city-queens-ny', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-soho-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/pet-supplies-astoria-queens-ny', priority: '0.9', changefreq: 'weekly' },
      // Niche keyword pages
      { path: '/raw-dog-food-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/organic-cat-food-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/luxury-pet-accessories-nyc', priority: '0.9', changefreq: 'weekly' },
      // Business pages
      { path: '/investors', priority: '0.7', changefreq: 'monthly' },
      { path: '/sell-with-us', priority: '0.8', changefreq: 'monthly' },
      // Neighborhood × Category programmatic pages (200 pages)
      // Dog food delivery — 50 neighborhoods
      { path: '/dog-food-delivery-flushing-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-jackson-heights-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-astoria-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-forest-hills-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-long-island-city-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-jamaica-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-bayside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-woodside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-sunnyside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-elmhurst-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-corona-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-rego-park-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-ridgewood-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-fresh-meadows-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-howard-beach-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-williamsburg-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-park-slope-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-sunset-park-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-crown-heights-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-flatbush-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-bay-ridge-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-bushwick-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-greenpoint-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-bed-stuy-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-fort-greene-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-carroll-gardens-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-cobble-hill-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-red-hook-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-brighton-beach-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-bensonhurst-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-upper-west-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-upper-east-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-chelsea-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-tribeca-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-hells-kitchen-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-harlem-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-washington-heights-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-midtown-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-east-village-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-inwood-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-riverdale-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-fordham-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-pelham-bay-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-mott-haven-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-concourse-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-throgs-neck-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-st-george-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-tottenville-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-great-kills-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-food-delivery-stapleton-staten-island', priority: '0.8', changefreq: 'weekly' },
      // Cat food delivery — 50 neighborhoods
      { path: '/cat-food-delivery-flushing-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-jackson-heights-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-astoria-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-forest-hills-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-long-island-city-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-jamaica-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-bayside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-woodside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-sunnyside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-elmhurst-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-corona-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-rego-park-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-ridgewood-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-fresh-meadows-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-howard-beach-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-williamsburg-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-park-slope-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-sunset-park-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-crown-heights-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-flatbush-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-bay-ridge-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-bushwick-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-greenpoint-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-bed-stuy-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-fort-greene-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-carroll-gardens-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-cobble-hill-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-red-hook-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-brighton-beach-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-bensonhurst-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-upper-west-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-upper-east-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-chelsea-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-tribeca-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-hells-kitchen-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-harlem-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-washington-heights-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-midtown-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-east-village-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-inwood-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-riverdale-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-fordham-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-pelham-bay-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-mott-haven-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-concourse-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-throgs-neck-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-st-george-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-tottenville-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-great-kills-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-food-delivery-stapleton-staten-island', priority: '0.8', changefreq: 'weekly' },
      // Pet supplies delivery — 50 neighborhoods
      { path: '/pet-supplies-delivery-flushing-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-jackson-heights-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-astoria-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-forest-hills-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-long-island-city-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-jamaica-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-bayside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-woodside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-sunnyside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-elmhurst-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-corona-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-rego-park-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-ridgewood-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-fresh-meadows-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-howard-beach-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-williamsburg-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-park-slope-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-sunset-park-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-crown-heights-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-flatbush-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-bay-ridge-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-bushwick-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-greenpoint-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-bed-stuy-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-fort-greene-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-carroll-gardens-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-cobble-hill-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-red-hook-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-brighton-beach-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-bensonhurst-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-upper-west-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-upper-east-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-chelsea-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-tribeca-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-hells-kitchen-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-harlem-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-washington-heights-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-midtown-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-east-village-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-inwood-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-riverdale-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-fordham-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-pelham-bay-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-mott-haven-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-concourse-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-throgs-neck-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-st-george-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-tottenville-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-great-kills-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/pet-supplies-delivery-stapleton-staten-island', priority: '0.8', changefreq: 'weekly' },
      // Dog treats delivery — 50 neighborhoods
      { path: '/dog-treats-delivery-flushing-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-jackson-heights-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-astoria-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-forest-hills-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-long-island-city-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-jamaica-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-bayside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-woodside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-sunnyside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-elmhurst-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-corona-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-rego-park-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-ridgewood-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-fresh-meadows-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-howard-beach-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-williamsburg-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-park-slope-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-sunset-park-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-crown-heights-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-flatbush-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-bay-ridge-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-bushwick-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-greenpoint-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-bed-stuy-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-fort-greene-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-carroll-gardens-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-cobble-hill-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-red-hook-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-brighton-beach-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-bensonhurst-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-upper-west-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-upper-east-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-chelsea-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-tribeca-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-hells-kitchen-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-harlem-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-washington-heights-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-midtown-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-east-village-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-inwood-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-riverdale-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-fordham-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-pelham-bay-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-mott-haven-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-concourse-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-throgs-neck-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-st-george-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-tottenville-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-great-kills-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/dog-treats-delivery-stapleton-staten-island', priority: '0.8', changefreq: 'weekly' },

      // NYC-level delivery hub pages (4 new)
      { path: '/cat-litter-delivery-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-nyc', priority: '0.9', changefreq: 'weekly' },
      { path: '/bird-food-delivery-nyc', priority: '0.9', changefreq: 'weekly' },

      // Cat litter delivery — 50 neighborhoods
      { path: '/cat-litter-delivery-flushing-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-jackson-heights-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-astoria-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-forest-hills-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-long-island-city-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-jamaica-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-bayside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-woodside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-sunnyside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-elmhurst-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-corona-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-rego-park-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-ridgewood-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-fresh-meadows-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-howard-beach-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-williamsburg-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-park-slope-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-sunset-park-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-crown-heights-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-flatbush-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-bay-ridge-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-bushwick-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-greenpoint-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-bed-stuy-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-fort-greene-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-carroll-gardens-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-cobble-hill-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-red-hook-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-brighton-beach-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-bensonhurst-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-upper-west-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-upper-east-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-chelsea-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-tribeca-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-hells-kitchen-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-harlem-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-washington-heights-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-midtown-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-east-village-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-inwood-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-riverdale-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-fordham-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-pelham-bay-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-mott-haven-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-concourse-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-throgs-neck-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-st-george-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-tottenville-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-great-kills-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-litter-delivery-stapleton-staten-island', priority: '0.8', changefreq: 'weekly' },

      // Cat treats delivery — 50 neighborhoods
      { path: '/cat-treats-delivery-flushing-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-jackson-heights-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-astoria-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-forest-hills-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-long-island-city-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-jamaica-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-bayside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-woodside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-sunnyside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-elmhurst-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-corona-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-rego-park-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-ridgewood-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-fresh-meadows-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-howard-beach-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-williamsburg-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-park-slope-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-sunset-park-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-crown-heights-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-flatbush-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-bay-ridge-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-bushwick-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-greenpoint-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-bed-stuy-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-fort-greene-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-carroll-gardens-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-cobble-hill-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-red-hook-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-brighton-beach-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-bensonhurst-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-upper-west-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-upper-east-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-chelsea-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-tribeca-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-hells-kitchen-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-harlem-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-washington-heights-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-midtown-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-east-village-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-inwood-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-riverdale-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-fordham-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-pelham-bay-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-mott-haven-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-concourse-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-throgs-neck-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-st-george-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-tottenville-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-great-kills-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/cat-treats-delivery-stapleton-staten-island', priority: '0.8', changefreq: 'weekly' },

      // Small pet supplies delivery — 50 neighborhoods
      { path: '/small-pet-supplies-delivery-flushing-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-jackson-heights-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-astoria-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-forest-hills-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-long-island-city-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-jamaica-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-bayside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-woodside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-sunnyside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-elmhurst-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-corona-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-rego-park-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-ridgewood-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-fresh-meadows-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-howard-beach-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-williamsburg-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-park-slope-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-sunset-park-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-crown-heights-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-flatbush-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-bay-ridge-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-bushwick-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-greenpoint-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-bed-stuy-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-fort-greene-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-carroll-gardens-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-cobble-hill-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-red-hook-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-brighton-beach-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-bensonhurst-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-upper-west-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-upper-east-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-chelsea-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-tribeca-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-hells-kitchen-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-harlem-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-washington-heights-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-midtown-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-east-village-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-inwood-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-riverdale-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-fordham-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-pelham-bay-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-mott-haven-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-concourse-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-throgs-neck-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-st-george-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-tottenville-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-great-kills-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/small-pet-supplies-delivery-stapleton-staten-island', priority: '0.8', changefreq: 'weekly' },

      // Bird food delivery — 50 neighborhoods
      { path: '/bird-food-delivery-flushing-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-jackson-heights-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-astoria-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-forest-hills-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-long-island-city-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-jamaica-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-bayside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-woodside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-sunnyside-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-elmhurst-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-corona-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-rego-park-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-ridgewood-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-fresh-meadows-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-howard-beach-queens', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-williamsburg-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-park-slope-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-sunset-park-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-crown-heights-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-flatbush-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-bay-ridge-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-bushwick-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-greenpoint-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-bed-stuy-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-fort-greene-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-carroll-gardens-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-cobble-hill-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-red-hook-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-brighton-beach-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-bensonhurst-brooklyn', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-upper-west-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-upper-east-side-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-chelsea-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-tribeca-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-hells-kitchen-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-harlem-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-washington-heights-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-midtown-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-east-village-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-inwood-manhattan', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-riverdale-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-fordham-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-pelham-bay-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-mott-haven-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-concourse-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-throgs-neck-bronx', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-st-george-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-tottenville-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-great-kills-staten-island', priority: '0.8', changefreq: 'weekly' },
      { path: '/bird-food-delivery-stapleton-staten-island', priority: '0.8', changefreq: 'weekly' },
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

