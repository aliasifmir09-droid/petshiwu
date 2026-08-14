/**
 * SEO registry drift guard.
 *
 * The neighborhood x category SEO routes are declared in TWO places that must
 * stay in perfect sync:
 *   - frontend: frontend/src/data/neighborhoodPages.ts  (ALL_NEIGHBORHOOD_PAGES)
 *   - backend:  backend/src/seo/neighborhoodRegistry.ts (CANONICAL_NEIGHBORHOOD_ROUTES)
 *
 * When these disagreed, valid neighborhood pages were classified as doorway /
 * noindex on one side while being linked/served on the other — a root cause of
 * the July indexing collapse. The 1,400 paths are now 301 redirects to city
 * landings, but both registries must still list the same slugs.
 *
 * Runtime-agnostic: runs under `bun scripts/check-seo-registries.ts` (CI) and
 * under `ts-node` locally.
 */

import { CANONICAL_NEIGHBORHOOD_ROUTES } from '../backend/src/seo/neighborhoodRegistry';
import { ALL_NEIGHBORHOOD_PAGES } from '../frontend/src/data/neighborhoodPages';

const EXPECTED_ROUTE_COUNT = 1400;

const backendSlugs = new Set(CANONICAL_NEIGHBORHOOD_ROUTES.map((r) => r.slug));
const frontendSlugs = new Set(ALL_NEIGHBORHOOD_PAGES.map((p) => p.slug));

const onlyInBackend = [...backendSlugs].filter((s) => !frontendSlugs.has(s)).sort();
const onlyInFrontend = [...frontendSlugs].filter((s) => !backendSlugs.has(s)).sort();

const problems: string[] = [];

if (backendSlugs.size !== EXPECTED_ROUTE_COUNT) {
  problems.push(
    `Backend registry has ${backendSlugs.size} unique routes; expected ${EXPECTED_ROUTE_COUNT}.`
  );
}
if (frontendSlugs.size !== EXPECTED_ROUTE_COUNT) {
  problems.push(
    `Frontend registry has ${frontendSlugs.size} unique routes; expected ${EXPECTED_ROUTE_COUNT}.`
  );
}
if (onlyInBackend.length > 0) {
  problems.push(
    `Routes in backend but NOT in frontend (${onlyInBackend.length}):\n  ${onlyInBackend
      .slice(0, 25)
      .join('\n  ')}${onlyInBackend.length > 25 ? '\n  ...' : ''}`
  );
}
if (onlyInFrontend.length > 0) {
  problems.push(
    `Routes in frontend but NOT in backend (${onlyInFrontend.length}):\n  ${onlyInFrontend
      .slice(0, 25)
      .join('\n  ')}${onlyInFrontend.length > 25 ? '\n  ...' : ''}`
  );
}

if (problems.length > 0) {
  console.error('❌ SEO neighborhood route registries are out of sync:\n');
  console.error(problems.join('\n\n'));
  console.error(
    '\nFix: keep frontend/src/data/neighborhoodPages.ts and ' +
      'backend/src/seo/neighborhoodRegistry.ts in sync (same category + neighborhood slugs).'
  );
  process.exit(1);
}

console.log(
  `✅ SEO route registries in sync: ${backendSlugs.size} canonical neighborhood routes match across frontend and backend.`
);
