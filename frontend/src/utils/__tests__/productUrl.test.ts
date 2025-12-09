/**
 * Product URL Utility Tests
 * Tests product URL generation
 */

import { describe, test, expect } from 'vitest';
import { generateProductUrl } from '../productUrl';
import { Product } from '@/types';

describe('Product URL Utility', () => {
  const mockProduct = {
    _id: '123',
    name: 'Test Product',
    slug: 'test-product',
    petType: 'dog',
    category: {
      _id: 'cat1',
      name: 'Food',
      slug: 'food',
      petType: 'dog',
      path: 'dog/food'
    } as any,
    price: 29.99,
    stock: 100,
    averageRating: 4.5,
    totalReviews: 10,
    description: 'Test description',
    brand: 'Test Brand',
    images: ['image1.jpg'],
    variants: [],
    basePrice: 29.99,
    inStock: true,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as unknown as Product;

  describe('generateProductUrl', () => {
    test('should generate URL with petType and category path', () => {
      const url = generateProductUrl(mockProduct);
      
      expect(url).toContain('dog');
      expect(url).toContain('food');
      expect(url).toContain('test-product');
    });

    test('should include product slug in URL', () => {
      const url = generateProductUrl(mockProduct);
      expect(url).toContain(mockProduct.slug);
    });

    test('should handle products without category', () => {
      const productWithoutCategory = {
        ...mockProduct,
        category: null as any
      } as Product;

      const url = generateProductUrl(productWithoutCategory);
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });

    test('should handle products with string category', () => {
      const productWithStringCategory = {
        ...mockProduct,
        category: 'Food' as any
      };

      const url = generateProductUrl(productWithStringCategory);
      expect(url).toBeDefined();
    });

    test('should generate valid URL format', () => {
      const url = generateProductUrl(mockProduct);
      
      // Should start with /
      expect(url.startsWith('/')).toBe(true);
      // Should not have double slashes (except after protocol)
      expect(url.includes('//')).toBe(false);
    });
  });
});

