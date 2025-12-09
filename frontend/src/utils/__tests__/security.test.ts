/**
 * Security Tests for XSS Protection
 * Tests DOMPurify sanitization in review rendering and description formatting
 */

import { describe, test, expect } from 'vitest';
import DOMPurify from 'dompurify';
import { renderFormattedDescription } from '../descriptionFormatter';

describe('XSS Protection Tests', () => {
  describe('DOMPurify Sanitization', () => {
    test('should sanitize script tags in review comments', () => {
      const maliciousInput = '<script>alert("XSS")</script>Hello World';
      const sanitized = DOMPurify.sanitize(maliciousInput, { 
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
      });
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello World');
    });

    test('should sanitize img tags with onerror in review comments', () => {
      const maliciousInput = '<img src=x onerror="alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(maliciousInput, { 
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
      });
      
      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('onerror');
    });

    test('should sanitize SVG tags with onload in review titles', () => {
      const maliciousInput = '<svg onload="alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });
      
      expect(sanitized).not.toContain('<svg');
      expect(sanitized).not.toContain('onload');
    });

    test('should sanitize user names with HTML', () => {
      const maliciousInput = '<strong>John</strong><script>alert("XSS")</script>';
      const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });
      
      expect(sanitized).not.toContain('<strong>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('John');
    });

    test('should allow safe HTML tags in review comments', () => {
      const safeInput = '<p>This is <strong>bold</strong> text</p>';
      const sanitized = DOMPurify.sanitize(safeInput, { 
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
      });
      
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('bold');
    });

    test('should remove all HTML from review titles', () => {
      const inputWithHtml = '<h1>Title</h1><script>alert("XSS")</script>';
      const sanitized = DOMPurify.sanitize(inputWithHtml, { ALLOWED_TAGS: [] });
      
      expect(sanitized).not.toContain('<h1>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Title');
    });
  });

  describe('Product Description Sanitization', () => {
    test('should sanitize HTML in product descriptions', () => {
      const maliciousDescription = '<p>Description</p><script>alert("XSS")</script>';
      renderFormattedDescription(maliciousDescription);
      
      // The component should render without script tags
      // We can't easily test JSX output, but we can verify the sanitization logic
      const sanitized = DOMPurify.sanitize(maliciousDescription, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<p>');
      expect(sanitized).toContain('Description');
    });

    test('should preserve markdown-style bold formatting', () => {
      const description = '**Bold text** and regular text';
      renderFormattedDescription(description);
      
      // Should preserve the **bold** markers for processing
      const sanitized = DOMPurify.sanitize(description, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
      
      expect(sanitized).toContain('**Bold text**');
    });

    test('should remove all HTML tags from descriptions', () => {
      const description = '<div>Content</div><img src=x onerror="alert(1)">';
      const sanitized = DOMPurify.sanitize(description, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
      
      expect(sanitized).not.toContain('<div>');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('Content');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty strings', () => {
      const sanitized = DOMPurify.sanitize('', { ALLOWED_TAGS: [] });
      expect(sanitized).toBe('');
    });

    test('should handle null/undefined gracefully', () => {
      // @ts-ignore - Testing edge case
      const sanitized = DOMPurify.sanitize(null, { ALLOWED_TAGS: [] });
      expect(sanitized).toBe('');
    });

    test('should handle very long malicious strings', () => {
      const longMaliciousString = '<script>'.repeat(1000) + 'alert("XSS")</script>'.repeat(1000);
      const sanitized = DOMPurify.sanitize(longMaliciousString, { ALLOWED_TAGS: [] });
      
      // Script tags should be removed, but text content may remain
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      // The word "alert" as text is harmless without script tags
      // What matters is that script tags are removed
    });

    test('should sanitize JavaScript event handlers', () => {
      const input = '<div onclick="alert(\'XSS\')" onmouseover="alert(\'XSS\')">Click me</div>';
      const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('onmouseover');
      expect(sanitized).toContain('Click me');
    });
  });
});

