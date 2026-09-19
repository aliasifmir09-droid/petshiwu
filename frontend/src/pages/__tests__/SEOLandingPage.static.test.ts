import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const landing = readFileSync(join(dir, '../SEOLandingPage.tsx'), 'utf8');
const app = readFileSync(join(dir, '../../App.tsx'), 'utf8');
const dog = readFileSync(join(dir, '../seo/DogFoodDeliveryNYC.tsx'), 'utf8');
const cat = readFileSync(join(dir, '../seo/CatFoodDeliveryNYC.tsx'), 'utf8');
const city = readFileSync(join(dir, '../seo/PetSuppliesDeliveryNYC.tsx'), 'utf8');
const queens = readFileSync(join(dir, '../seo/PetSuppliesQueensNY.tsx'), 'utf8');

describe('NYC shoppable hubs keep every indexed URL', () => {
  test('the four NYC hubs stay routed and turn on the shoppable module', () => {
    expect(app).toContain('/dog-food-delivery-nyc');
    expect(app).toContain('/cat-food-delivery-nyc');
    expect(app).toContain('/pet-supplies-delivery-nyc');
    expect(app).toContain('/pet-supplies-queens-ny');
    expect(dog).toContain('shoppableHub');
    expect(cat).toContain('shoppableHub');
    expect(city).toContain('shoppableHub');
    expect(queens).toContain('shoppableHub');
    expect(landing).toContain('TonightPromiseCard');
    expect(landing).toContain('NycHubCompare');
    expect(landing).toContain('HubBuyerRatings');
    expect(landing).toContain('id="in-stock"');
    expect(landing).toContain('NYC_HUB_NATIONWIDE_HEADING');
    expect(landing).toContain('NycHubLinkGrid');
  });

  test('hubs do not noindex the page or send shoppers to a search dead-end', () => {
    expect(landing).toContain('noindex={hasQueryVariant}');
    expect(landing).not.toMatch(/noindex=\{true\}/);
    expect(dog).toMatch(/nationwide shipping opens/i);
    expect(cat).toMatch(/nationwide shipping opens/i);
    expect(city).toMatch(/nationwide shipping opens/i);
    expect(queens).toMatch(/nationwide shipping opens/i);
  });
});
