/**
 * 301 the 1,400 thin neighborhood×category URLs onto real landing pages.
 * Google was treating those copies as duplicates and skipping the shop.
 */
import { Request, Response, NextFunction } from 'express';
import { getNeighborhoodRoute, neighborhoodLandingPath } from '../seo/neighborhoodRegistry';

export const neighborhoodRedirectMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();

  const route = getNeighborhoodRoute(req.path);
  if (!route) return next();

  const target = neighborhoodLandingPath(route.categorySlug);
  if (!target || target === req.path) return next();

  res.redirect(301, target);
};
