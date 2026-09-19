import { INDEXABLE_LANDING_PATHS, classifyRoute } from '../../../seo/routeClassifier';
import { buildNycHubLinkHtml, buildNycHubShopHtml, isNycShoppableHub, NYC_HUB_PATHS } from '../../../seo/nycShopHub';

describe('nycShopHub first-wave extras', () => {
  it('marks only the four NYC #1 hubs and keeps them indexable', () => {
    expect(NYC_HUB_PATHS.size).toBe(4);
    for (const path of NYC_HUB_PATHS) {
      expect(isNycShoppableHub(path)).toBe(true);
      expect(INDEXABLE_LANDING_PATHS.has(path)).toBe(true);
      expect(classifyRoute(path).indexable).toBe(true);
    }
    expect(isNycShoppableHub('/learning/best-organic-dog-food-2026')).toBe(false);
    expect(classifyRoute('/learning/best-organic-dog-food-2026').indexable).toBe(true);
  });

  it('builds compare HTML without claiming same-day nationwide', () => {
    const html = buildNycHubShopHtml();
    expect(html).toContain('Check your ZIP');
    expect(html).toContain('Petshiwü');
    expect(html).toContain('All 5 boroughs');
    expect(html).toMatch(/never same-day outside the five boroughs/i);
    expect(html).not.toMatch(/same-day nationwide/i);
  });

  it('cross-links the other NYC hubs and keeps nationwide off same-day', () => {
    const html = buildNycHubLinkHtml('/dog-food-delivery-nyc');
    expect(html).toContain('/cat-food-delivery-nyc');
    expect(html).toContain('/pet-supplies-delivery-nyc');
    expect(html).toContain('/pet-supplies-queens-ny');
    expect(html).not.toContain('href="https://www.petshiwu.com/dog-food-delivery-nyc"');
    expect(html).toMatch(/nationwide shipping next/i);
  });
});
