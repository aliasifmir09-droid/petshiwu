/**
 * blogRedirect.ts — 301 redirect middleware for consolidated neighborhood blog pages.
 *
 * Thin neighborhood delivery pages are redirected to 5 rich borough hub pages.
 * Google passes link equity through 301 redirects.
 */

import { Request, Response, NextFunction } from 'express';
import { BLOG_REDIRECTS } from '../seo/blogRedirects';

export { BLOG_REDIRECTS };

// Pre-filter: only process requests that match the /learning/ pattern
const LEARNING_RE = /^\/learning\//;

export const blogRedirectMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method !== 'GET') return next();
  if (!LEARNING_RE.test(req.path)) return next();

  const slug = req.path.replace('/learning/', '').replace(/\/$/, '');
  const newSlug = BLOG_REDIRECTS[slug];
  if (!newSlug) return next();

  res.redirect(301, `/learning/${newSlug}`);
};
