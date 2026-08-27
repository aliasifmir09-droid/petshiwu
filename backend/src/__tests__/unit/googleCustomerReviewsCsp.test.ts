import fs from 'fs';
import path from 'path';

describe('Google Customer Reviews CSP', () => {
  test('allows Google Customer Reviews scripts, XHR, and survey frames', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../server.ts'), 'utf8');
    expect(src).toContain('https://apis.google.com');
    expect(src).toContain('https://www.gstatic.com');
    expect(src).toContain('https://www.google.com');
    expect(src).toContain('https://accounts.google.com');
    expect(src).toContain("frameSrc: [\"'self'\"");
  });
});
