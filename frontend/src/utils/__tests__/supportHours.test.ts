import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { generateOrganizationSchema } from '../seoUtils';

const frontendRoot = path.resolve(__dirname, '../../..');

const customerFacing = [
  'src/pages/Contact.tsx',
  'src/pages/About.tsx',
  'src/pages/Home.tsx',
  'src/App.tsx',
  'src/pages/VetTeam.tsx',
  'src/pages/seo/PetSuppliesJacksonHeightsNY.tsx',
  'src/pages/Press.tsx',
  'src/pages/Terms.tsx',
  'src/pages/PrivacyPolicy.tsx',
  'src/pages/ShippingPolicy.tsx',
  'src/pages/Accessibility.tsx',
  'src/components/StructuredData.tsx',
  'index.html',
];

const limitedHours = [
  /9am[–-]8pm/i,
  /9am[–-]6pm/i,
  /9:00 AM – 8:00 PM/,
  /Mo-Su 08:00-20:00/,
  /Mo-Su 09:00-20:00/,
  /opens: '09:00'/,
  /"opens": "09:00"/,
  /during business hours/,
];

describe('support copy does not claim a 24/7 call center', () => {
  test.each(customerFacing)('%s does not advertise 24/7 phone support', (rel) => {
    const src = fs.readFileSync(path.join(frontendRoot, rel), 'utf8');
    expect(src).not.toMatch(/24\/7/);
    for (const pattern of limitedHours) {
      expect(src).not.toMatch(pattern);
    }
  });

  test('organization schema does not publish call-center hours', () => {
    const schema = generateOrganizationSchema() as {
      contactPoint: { hoursAvailable?: { opens: string } };
    };
    expect(schema.contactPoint.hoursAvailable).toBeUndefined();
  });
});
