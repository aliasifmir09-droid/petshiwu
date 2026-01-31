/**
 * Notify search engines when content changes so they re-crawl the sitemap.
 * Called after products or blogs are created/updated.
 * Google and Bing will discover new URLs via the sitemap on next crawl.
 */

import https from 'https';
import logger from './logger';

const getBaseUrl = (): string => {
  return process.env.FRONTEND_URL || process.env.SITE_URL || process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'https://www.petshiwu.com';
};

/**
 * Ping search engines to notify them of sitemap updates.
 * Run in background - don't await. Failures are logged but don't affect the request.
 */
export const pingSearchEngines = (): void => {
  const baseUrl = getBaseUrl();
  const sitemapUrl = `${baseUrl.replace(/\/$/, '')}/sitemap.xml`;

  const engines = [
    { name: 'Google', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
    { name: 'Bing', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
    { name: 'Yandex', url: `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` }
  ];

  engines.forEach(({ name, url }) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          logger.info(`[SEO] ${name} pinged successfully for sitemap`);
        } else {
          logger.warn(`[SEO] ${name} ping returned status ${res.statusCode}`);
        }
      })
      .on('error', (err) => {
        logger.warn(`[SEO] Failed to ping ${name}:`, err.message);
      });
  });
};
