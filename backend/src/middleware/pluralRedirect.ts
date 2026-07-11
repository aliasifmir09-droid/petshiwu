/**
 * pluralRedirect.ts — 301 redirect plural category URLs to singular canonical URLs.
 *
 * The site uses singular pet type slugs in product URLs (e.g. /dog/food--bowls/...),
 * but the static shell's nav section previously linked to plural variants (/dogs, /cats, etc.).
 * Both plural and singular URLs served identical 200-status content, creating duplicate
 * content issues that split link equity and waste crawl budget.
 *
 * This middleware 301-redirects all plural variants to their singular canonical form
 * BEFORE the bot renderer or SPA catch-all can serve content.
 *
 * Redirects:
 *   /dogs     → /dog
 *   /dogs/*   → /dog/*
 *   /cats     → /cat
 *   /cats/*   → /cat/*
 *   /birds    → /bird
 *   /birds/*  → /bird/*
 *   /reptiles → /reptile
 *   /reptiles/* → /reptile/*
 *   /small-animals → /small-animal
 *   /small-animals/* → /small-animal/*
 */

import { Request, Response, NextFunction } from 'express';

const PLURAL_TO_SINGULAR: Record<string, string> = {
  dogs: 'dog',
  cats: 'cat',
  birds: 'bird',
  reptiles: 'reptile',
  'small-animals': 'small-animal',
};

const BASE_URL = 'https://www.petshiwu.com';

export const pluralRedirectMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();

  // Split path into segments
  const segments = req.path.replace(/^\//, '').split('/').filter(Boolean);
  if (segments.length === 0) return next();

  const firstSegment = segments[0];
  const singular = PLURAL_TO_SINGULAR[firstSegment];

  if (!singular) return next();

  // Reconstruct the path with the singular first segment
  const remainingSegments = segments.slice(1);
  const newPath = '/' + [singular, ...remainingSegments].join('/');

  // Preserve query string
  const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  // 301 permanent redirect
  res.redirect(301, `${newPath}${queryString}`);
};
