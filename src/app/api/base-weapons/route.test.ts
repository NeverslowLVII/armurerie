import { prisma } from '@/lib/prisma';
import type { BaseWeapon } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route'; // Import handlers

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    baseWeapon: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Helper function to create a mock NextRequest (for POST)
const createMockPostRequest = (body: any): Request => {
  const req = {
    json: async () => body,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    // Add other properties needed if your handler uses them
  } as unknown as Request; // Use native Request type
  return req;
};

// Cast mocked functions
const mockedFindMany = vi.mocked(prisma.baseWeapon.findMany);
const mockedCreate = vi.mocked(prisma.baseWeapon.create);

describe('/api/base-weapons Route Handlers', () => {
  let testWeapons: BaseWeapon[];
  let newWeaponData: Omit<BaseWeapon, 'id'>; // Data for creating a new weapon
  let createdWeapon: BaseWeapon;

  beforeEach(() => {
    vi.resetAllMocks();

    testWeapons = [
      {
        id: 1,
        nom: 'Test Pistol',
        prix_defaut: 100.5,
        cout_production_defaut: 50.25,
      },
      {
        id: 2,
        nom: 'Test Rifle',
        prix_defaut: 300.0,
        cout_production_defaut: 150.0,
      },
    ];

    newWeaponData = {
      nom: 'New SMG',
      prix_defaut: 180.0,
      cout_production_defaut: 90.0,
    };

    createdWeapon = {
      id: 3, // Simulate DB assigning an ID
      ...newWeaponData,
    };

    // Default mock implementations
    mockedFindMany.mockResolvedValue(testWeapons);
    mockedCreate.mockResolvedValue(createdWeapon);
  });

  // --- GET Handler Tests ---
  describe('GET Handler', () => {
    it('should return all base weapons', async () => {
      const response = await GET();
      const body = await response.json();

      expect(mockedFindMany).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(body).toEqual(testWeapons);
      expect(body.length).toBe(2);
    });

    it('should return 500 on database error', async () => {
      mockedFindMany.mockRejectedValue(new Error('DB findMany error'));
      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Error fetching base weapons');
    });
  });

  // --- POST Handler Tests ---
  describe('POST Handler', () => {
    it('should create a new base weapon', async () => {
      const mockRequest = createMockPostRequest(newWeaponData);
      const response = await POST(mockRequest);
      const body = await response.json();

      expect(mockedCreate).toHaveBeenCalledTimes(1);
      expect(mockedCreate).toHaveBeenCalledWith({ data: newWeaponData });
      expect(response.status).toBe(200);
      expect(body).toEqual(createdWeapon);
      expect(body.id).toBe(3);
      expect(body.nom).toBe(newWeaponData.nom);
    });

    it('should create a new base weapon with default cost if not provided', async () => {
      const dataWithoutCost = {
        nom: 'New Knife',
        prix_defaut: 50.0,
        // cout_production_defaut is missing
      };
      const expectedCreateData = {
        ...dataWithoutCost,
        cout_production_defaut: 0, // Handler should default this
      };
      const mockCreatedWeaponWithDefaultCost = {
        id: 4,
        ...expectedCreateData,
      };
      mockedCreate.mockResolvedValue(mockCreatedWeaponWithDefaultCost);

      const mockRequest = createMockPostRequest(dataWithoutCost);
      const response = await POST(mockRequest);
      const body = await response.json();

      expect(mockedCreate).toHaveBeenCalledTimes(1);
      expect(mockedCreate).toHaveBeenCalledWith({ data: expectedCreateData });
      expect(response.status).toBe(200);
      expect(body).toEqual(mockCreatedWeaponWithDefaultCost);
      expect(body.cout_production_defaut).toBe(0);
    });

    it('should return 500 on database error during creation', async () => {
      mockedCreate.mockRejectedValue(new Error('DB create error'));
      const mockRequest = createMockPostRequest(newWeaponData);
      const response = await POST(mockRequest);
      const body = await response.json();

      expect(mockedCreate).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(500);
      expect(body.error).toBe('Error creating base weapon');
    });

    it('should return 500 if request body is malformed/missing', async () => {
      // Simulate invalid JSON or missing fields triggering an error before Prisma call
      const mockRequest = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as unknown as Request;

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(mockedCreate).not.toHaveBeenCalled(); // Prisma should not be called
      expect(response.status).toBe(500);
      expect(body.error).toBe('Error creating base weapon'); // Generic error from catch block
    });
  });
});
