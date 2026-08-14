/**
 * URLs like /cat/undefined/wet-food/{slug} were crawled as duplicates / soft 404s.
 * Send Google to /products/{last-segment} so the existing product canonical 301 can finish.
 */
import { Request, Response, NextFunction } from 'express';

export const brokenSlugRedirectMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();

  const segments = req.path.split('/').filter(Boolean);
  if (!segments.some((part) => part === 'undefined' || part === 'null')) {
    return next();
  }

  const last = segments[segments.length - 1];
  if (last && last !== 'undefined' && last !== 'null') {
    res.redirect(301, `/products/${encodeURIComponent(last)}`);
    return;
  }

  res.redirect(301, '/products');
};
