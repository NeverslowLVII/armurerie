import { describe, it, expect } from 'vitest';

// Utilitaires simples pour les tests
const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const truncate = (str: string, maxLength: number): string => {
  if (str === null || str === undefined) return null as unknown as string;
  if (str === '') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength).trim() + '...';
};

const slugify = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^\w-]+/g, '')
    .replaceAll(/--+/g, '-')
    .replaceAll(/^-+|-+$/g, ''); // Supprime les tirets au début et à la fin
};

describe('String Utils', () => {
  describe('capitalize', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('JavaScript')).toBe('Javascript');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
      expect(capitalize(null as unknown as string)).toBe('');
      expect(capitalize(undefined as unknown as string)).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate strings longer than maxLength', () => {
      expect(truncate('This is a long string', 10)).toBe('This is a...');
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should handle edge cases', () => {
      expect(truncate('', 10)).toBe('');
      expect(truncate(null as unknown as string, 10)).toBe(null);
      expect(truncate('Text', 0)).toBe('...');
    });
  });

  describe('slugify', () => {
    it('should convert strings to URL-friendly slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('This is a TEST!')).toBe('this-is-a-test');
      expect(slugify('  Spaces  at  ends  ')).toBe('spaces-at-ends');
    });

    it('should handle special characters', () => {
      expect(slugify('Product (2023)')).toBe('product-2023');
      expect(slugify('émilie & françois')).toBe('milie-franois');
    });
  });
}); 