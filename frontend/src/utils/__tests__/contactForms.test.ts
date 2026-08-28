import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const pagesDir = path.resolve(__dirname, '../../pages');
const footerFile = path.resolve(__dirname, '../../components/Footer.tsx');

function read(file: string) {
  return fs.readFileSync(file, 'utf8');
}

describe('contact forms post to the real API', () => {
  test('Contact Us posts general inquiries', () => {
    const src = read(path.join(pagesDir, 'Contact.tsx'));
    expect(src).toContain("api.post('/v1/contact/general'");
    expect(src).not.toContain('Simulate submission');
    expect(src).toContain('support@petshiwu.com');
  });

  test('Investor form does not double the /api prefix', () => {
    const src = read(path.join(pagesDir, 'Investors.tsx'));
    expect(src).toContain("api.post('/v1/contact/investor'");
    expect(src).not.toContain("api.post('/api/v1/contact/investor'");
  });

  test('Sell with us form does not double the /api prefix', () => {
    const src = read(path.join(pagesDir, 'SellWithUs.tsx'));
    expect(src).toContain("api.post('/v1/contact/vendor'");
    expect(src).not.toContain("api.post('/api/v1/contact/vendor'");
  });

  test('footer newsletter actually subscribes', () => {
    const src = read(footerFile);
    expect(src).toContain("api.post('/v1/newsletter/subscribe'");
    expect(src).not.toContain('onSubmit={(e) => e.preventDefault()}');
    expect(src).toContain('FREEDOM20');
  });

  test('homepage subscribe posts to the API and shows FREEDOM20', () => {
    const src = read(path.join(pagesDir, 'Home.tsx'));
    expect(src).toContain('/v1/newsletter/subscribe');
    expect(src).toContain('source: \'homepage\'');
    expect(src).toContain('FREEDOM20');
    expect(src).not.toContain('WELCOME10');
  });

  test('email popup subscribe posts to the API and shows FREEDOM20', () => {
    const src = read(path.resolve(__dirname, '../../components/EmailPopup.tsx'));
    expect(src).toContain('/v1/newsletter/subscribe');
    expect(src).toContain('source: \'popup\'');
    expect(src).toContain('FREEDOM20');
    expect(src).not.toContain('WELCOME10');
  });

  test('unsubscribe page is wired to the newsletter API', () => {
    const appSrc = read(path.resolve(__dirname, '../../App.tsx'));
    const pageSrc = read(path.join(pagesDir, 'Unsubscribe.tsx'));
    expect(appSrc).toContain('path="/unsubscribe"');
    expect(pageSrc).toContain("api.get('/v1/newsletter/unsubscribe'");
  });
});
