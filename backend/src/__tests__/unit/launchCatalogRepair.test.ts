import {
  HILLS_CD_OCEAN_FISH_SLUG,
  NULO_DROP_SLUG,
  NULO_KEEP_SLUG,
  PURINA_BEEF_SLUG,
  planLaunchCatalogRepairs,
  repairedPurinaVariants,
} from '../../services/launchCatalogRepair';

describe('launchCatalogRepair plans', () => {
  test('slugifies leftover small pet records', () => {
    const plan = planLaunchCatalogRepairs({
      slug: 'trixie-2-in-1-rabbit-hutch',
      petType: 'small pet',
    });
    expect(plan.slugifyPetType).toBe(true);
  });

  test('replaces the Hills Ocean Fish wet-can photo', () => {
    const plan = planLaunchCatalogRepairs({
      slug: HILLS_CD_OCEAN_FISH_SLUG,
      petType: 'cat',
    });
    expect(plan.replaceHillsImage).toBe(true);
  });

  test('keeps one Nulo puppy listing and drops the duplicate slug', () => {
    expect(planLaunchCatalogRepairs({ slug: NULO_DROP_SLUG }).deactivateNuloDuplicate).toBe(true);
    expect(planLaunchCatalogRepairs({ slug: NULO_KEEP_SLUG }).keepNuloLegacySlug).toBe(true);
  });

  test('swaps the Purina 5 lb price that was stored as compare-at', () => {
    const variants = repairedPurinaVariants([
      {
        price: 74.99,
        compareAtPrice: 16.58,
        attributes: { 'flavor: Chicken & Rice': '5 Lb' },
      },
      {
        price: 41.38,
        compareAtPrice: 41.99,
        attributes: { 'flavor: Chicken & Rice': '15 Lb' },
      },
    ]);
    expect(variants[0].price).toBe(16.58);
    expect(variants[0].compareAtPrice).toBeUndefined();
    expect(variants[0].attributes?.['flavor: Beef & Rice']).toBe('5 Lb');
    expect(variants[1].price).toBe(41.38);
    expect(variants[1].compareAtPrice).toBe(41.99);
    expect(planLaunchCatalogRepairs({ slug: PURINA_BEEF_SLUG }).fixPurinaBeefListing).toBe(true);
  });
});
