/**
 * blogRedirect.ts — 301 redirect middleware for consolidated neighborhood blog pages.
 *
 * 44 thin neighborhood delivery pages (e.g. /learning/pet-food-and-supplies-delivery-in-flatbush-brooklyn-ny)
 * are redirected to 5 rich borough hub pages (e.g. /learning/pet-food-delivery-brooklyn-ny-petshiwu).
 *
 * Google passes link equity through 301 redirects — all authority from the old pages flows
 * to the new hub pages.
 */

import { Request, Response, NextFunction } from 'express';

// Map: old slug → new hub slug
const BLOG_REDIRECTS: Record<string, string> = {
  // ── Brooklyn ──────────────────────────────────────────────────────────────
  'pet-food-and-supplies-delivery-in-bay-ridge-brooklyn-ny':        'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-bed-stuy-brooklyn-ny':         'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-bensonhurst-brooklyn-ny':      'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-borough-park-brooklyn-ny':     'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-brooklyn-heights-brooklyn-ny': 'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-crown-heights-brooklyn-ny':    'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-flatbush-brooklyn-ny':         'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-greenpoint-brooklyn-ny':       'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-park-slope-brooklyn-ny':       'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-sheepshead-bay-brooklyn-ny':   'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-sunset-park-brooklyn-ny':      'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-williamsburg-brooklyn-ny':     'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-delivery-in-bay-ridge-brooklyn-ny-petshiwu':            'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-delivery-in-brownsville-brooklyn-ny-petshiwu':          'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-delivery-in-bushwick-brooklyn-ny-petshiwu':             'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-delivery-in-crown-heights-brooklyn-ny-petshiwu':        'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-delivery-in-east-flatbush-brooklyn-ny-petshiwu':        'pet-food-delivery-brooklyn-ny-petshiwu',
  'pet-food-delivery-in-flatbush-brooklyn-ny-petshiwu':             'pet-food-delivery-brooklyn-ny-petshiwu',

  // ── Queens ────────────────────────────────────────────────────────────────
  'pet-food-and-supplies-delivery-in-astoria-queens-ny':            'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-bayside-queens-ny':            'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-corona-queens-ny':             'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-elmhurst-queens-ny':           'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-flushing-queens-ny':           'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-forest-hills-queens-ny':       'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-fresh-meadows-queens-ny':      'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-jamaica-queens-ny':            'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-rego-park-queens-ny':          'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-sunnyside-queens-ny':          'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-whitestone-queens-ny':         'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-woodside-queens-ny':           'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-delivery-in-glendale-queens-ny-petshiwu':               'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-delivery-in-howard-beach-queens-ny-petshiwu':           'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-delivery-in-kew-gardens-queens-ny-petshiwu':            'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-delivery-in-maspeth-queens-ny-petshiwu':                'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-delivery-in-middle-village-queens-ny-petshiwu':         'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-delivery-in-ozone-park-queens-ny-petshiwu':             'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-delivery-in-richmond-hill-queens-ny-petshiwu':          'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-delivery-in-ridgewood-queens-ny-petshiwu':              'pet-food-delivery-queens-ny-petshiwu',
  'pet-food-delivery-in-springfield-gardens-queens-ny-petshiwu':    'pet-food-delivery-queens-ny-petshiwu',

  // ── Manhattan ─────────────────────────────────────────────────────────────
  'pet-food-and-supplies-delivery-in-astoria-manhattan-ny':         'pet-food-delivery-manhattan-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-chelsea-manhattan-ny':         'pet-food-delivery-manhattan-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-harlem-manhattan-ny':          'pet-food-delivery-manhattan-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-hell039s-kitchen-manhattan-ny':'pet-food-delivery-manhattan-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-lower-east-side-manhattan-ny': 'pet-food-delivery-manhattan-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-upper-east-side-manhattan-ny': 'pet-food-delivery-manhattan-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-upper-west-side-manhattan-ny': 'pet-food-delivery-manhattan-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-washington-heights-manhattan-ny': 'pet-food-delivery-manhattan-ny-petshiwu',

  // ── Bronx ─────────────────────────────────────────────────────────────────
  'pet-food-and-supplies-delivery-in-concourse-bronx-ny':           'pet-food-delivery-bronx-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-fordham-bronx-ny':             'pet-food-delivery-bronx-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-morris-park-bronx-ny':         'pet-food-delivery-bronx-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-pelham-bay-bronx-ny':          'pet-food-delivery-bronx-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-riverdale-bronx-ny':           'pet-food-delivery-bronx-ny-petshiwu',
  'pet-food-and-supplies-delivery-in-tremont-bronx-ny':             'pet-food-delivery-bronx-ny-petshiwu',
};

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
