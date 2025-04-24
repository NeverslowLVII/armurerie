/** @vitest-environment node */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/weapons/catalog/route';
// Retrait de l'import de NextResponse car on utilise le mock direct
// import { NextResponse } from 'next/server';

// --- Explicitly Hoist Mock Definitions ---
const { mockNextResponseJson, mockFindMany } = vi.hoisted(() => {
  return {
    mockNextResponseJson: vi.fn((body, init) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
    mockFindMany: vi.fn(),
  };
});

// --- Mock Implementations (using hoisted mocks) ---

// Mock next/server USING hoisted mockNextResponseJson
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: mockNextResponseJson,
    },
  };
});

// Mock Prisma instance from the lib module USING hoisted mockFindMany
vi.mock('../../../src/lib/prisma', async () => {
  const actual = await vi.importActual('../../../src/lib/prisma');
  return {
    // Mock the default export (the prisma instance)
    default: {
      weaponCatalog: {
        findMany: mockFindMany,
      },
      // Include other models if necessary for broader testing
    },
    // Mock named exports if they were used
    // prisma: { weaponCatalog: { findMany: mockFindMany } } // Example if named export was used
  };
});

// --- Test Suite ---

// Réinitialiser les mocks avant chaque test
beforeEach(() => {
  vi.clearAllMocks();
});

describe('API Route: /api/weapons/catalog', () => {
  describe('GET', () => {
    it('should return weapon catalog on success', async () => {
      const mockCatalog = [
        { id: 1, name: 'Weapon A', type: 'Type1', price: 1000 },
        { id: 2, name: 'Weapon B', type: 'Type2', price: 2000 },
      ];
      mockFindMany.mockResolvedValue(mockCatalog);

      const response = await GET();
      const body = await response.json();

      // Plus besoin de vérifier prisma.weaponCatalog.findMany car le mock intercepte l'appel dans GET
      expect(mockFindMany).toHaveBeenCalledTimes(1);
      expect(mockNextResponseJson).toHaveBeenCalledWith(mockCatalog, undefined);
      expect(response.status).toBe(200);
      expect(body).toEqual(mockCatalog);
    });

    it('should return 500 error on database failure', async () => {
      const dbError = new Error('Database connection failed');
      mockFindMany.mockRejectedValue(dbError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const response = await GET();
      const body = await response.json();

      expect(mockFindMany).toHaveBeenCalledTimes(1);
      expect(mockNextResponseJson).toHaveBeenCalledWith(
        { error: 'Failed to fetch weapon catalog' },
        { status: 500 }
      );
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to fetch weapon catalog' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching weapon catalog:', dbError);

      consoleErrorSpy.mockRestore();
    });
  });
}); 