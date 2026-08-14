import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import Blog from '../models/Blog';
import CareGuide from '../models/CareGuide';
import FAQ from '../models/FAQ';
import PetType from '../models/PetType';
import logger from '../utils/logger';
import { classifyRoute } from '../seo/routeClassifier';

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

const filterSitemapXml = (xml: string): string => {
  const seen = new Set<string>();
  return xml.replace(/  <url>\n[\s\S]*?  <\/url>\n/g, (block) => {
    const match = block.match(/<loc>([^<]+)<\/loc>/);
    if (!match) return '';
    const raw = match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    if (/\s/.test(raw) || raw.includes('?') || raw.includes('#')) return '';
    let parsed: URL;
    try { parsed = new URL(raw); } catch { return ''; }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    const pathname = parsed.pathname;
    const classification = classifyRoute(pathname);
    const normalized = classification.canonicalPath;
    if (!classification.indexable || classification.status !== 'indexable' || classification.canonicalPath !== pathname || seen.has(normalized) || /\s/.test(raw)) return '';
    seen.add(normalized);
    return block;
  });
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
      // Map small-pet → small-animal to match frontend route
      const petSlug = petType.slug === 'small-pet' ? 'small-animal' : petType.slug;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/${petSlug}</loc>\n`;
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

            // Reject slugs with HTML-entity artifacts or repeated-dash artifacts.
            // Prevents 370+ broken URLs (soft-404s for Google) from being in sitemap.
            const BROKEN_SLUG_RE = /039|ampamp|ampquot|--amp|^amp-|amp-|-amp-|--+/;
            const isCleanSlug = (slug: unknown): boolean => {
              if (!isValidSlug(slug)) return false;
              return !BROKEN_SLUG_RE.test(String(slug));
            };

            productsWithCategory.forEach(product => {
              // Skip products with broken slugs entirely — they 404 in Google
              if (!isCleanSlug(product.slug)) return;

              const lastmod = product.updatedAt
                ? new Date(product.updatedAt).toISOString().split('T')[0]
                : currentDate;

              // Mirror botRenderer canonical exactly: /{petType}/{categorySlug}/{productSlug}
              const categorySlug = (product.category && typeof product.category === 'object')
                ? (product.category as any).slug
                : undefined;

              let productUrl = `${baseUrl}/products/${product.slug}`;
              if (isValidSlug(product.petType) && isValidSlug(categorySlug) && isCleanSlug(categorySlug)) {
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

            // Category pages — skip broken slugs (soft-404 trap) + only clean canonical URLs (no query params)
                  // Filtered URLs (?petType=dog) canonicalize to clean URL — sitemap should NOT list them.
                  categories.forEach(category => {
                    if (!isCleanSlug(category.slug)) return;
                    const lastmod = category.updatedAt
                      ? new Date(category.updatedAt).toISOString().split('T')[0]
                      : currentDate;

                    const categoryPetType = typeof category.petType === 'string' ? category.petType : '';
                    const categoryPath = categoryPetType && categoryPetType !== 'all' && categoryPetType !== 'other-animals'
                      ? `/${categoryPetType}/${category.slug}`
                      : `/category/${category.slug}`;
                    xml += '  <url>\n';
                    xml += `    <loc>${baseUrl}${categoryPath}</loc>\n`;
                    xml += `    <lastmod>${lastmod}</lastmod>\n`;
                    xml += '    <changefreq>weekly</changefreq>\n';
                    xml += '    <priority>0.7</priority>\n';
                    xml += '  </url>\n';
                  });

            // Blog/Learning pages — skip broken slugs (soft-404 trap)
            blogs.forEach(blog => {
              if (!isCleanSlug(blog.slug)) return;
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

    // Search page — utility, not a landing page
    // (intentionally omitted from the sitemap; /search is noindex)

    // Static pages
    let staticPages = [
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
      { path: '/innovation', priority: '0.8', changefreq: 'weekly' },
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
    xml = filterSitemapXml(xml);

    // Set proper content type with charset for XML
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(xml);
  } catch (error: any) {
    logger.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};

