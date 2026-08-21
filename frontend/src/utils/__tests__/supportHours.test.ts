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

describe('call center hours are 24/7', () => {
  test.each(customerFacing)('%s does not advertise limited phone hours', (rel) => {
    const src = fs.readFileSync(path.join(frontendRoot, rel), 'utf8');
    for (const pattern of limitedHours) {
      expect(src).not.toMatch(pattern);
    }
  });

  test('Contact page tells shoppers the call center is 24/7', () => {
    const src = fs.readFileSync(path.join(frontendRoot, 'src/pages/Contact.tsx'), 'utf8');
    expect(src).toContain('Call center hours');
    expect(src).toContain('24/7');
    expect(src).toContain("opens: '00:00'");
    expect(src).toContain("closes: '23:59'");
  });

  test('organization schema marks customer service as 24/7', () => {
    const schema = generateOrganizationSchema() as {
      contactPoint: { hoursAvailable: { opens: string; closes: string } };
    };
    expect(schema.contactPoint.hoursAvailable.opens).toBe('00:00');
    expect(schema.contactPoint.hoursAvailable.closes).toBe('23:59');
  });
});
