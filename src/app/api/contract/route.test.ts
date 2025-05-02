import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Mock next-auth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock NextResponse - needed to check redirect
// We don't mock the whole module, just spy on the redirect method
const redirectSpy = vi.spyOn(NextResponse, 'redirect');

// Cast mocked functions
const mockedGetServerSession = vi.mocked(getServerSession);
const mockedUserFindUnique = vi.mocked(prisma.user.findUnique);

describe('/api/contract Route Handler', () => {
  const testUserId = 1;
  const testContractUrl = 'https://example.com/contract/user1.pdf';

  let mockSession: Session | null;
  let mockUser: Partial<User> | null; // Use Partial for flexibility

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks for success case
    mockSession = {
      user: {
        id: String(testUserId),
        email: 'test@example.com',
        name: 'Test User',
        role: Role.EMPLOYEE,
        image: null,
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Example expiry
    };
    mockUser = {
      id: testUserId,
      contractUrl: testContractUrl,
    };

    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedUserFindUnique.mockResolvedValue(mockUser as User); // Cast needed
  });

  // --- GET Handler Tests ---
  describe('GET Handler', () => {
    it('should redirect to contract URL if session and user/URL exist', async () => {
      const response = await GET();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).toHaveBeenCalledWith({
        where: { id: testUserId },
        select: { contractUrl: true },
      });
      expect(redirectSpy).toHaveBeenCalledTimes(1);
      expect(redirectSpy).toHaveBeenCalledWith(testContractUrl);
      // Check if the returned object is the result of the spy
      expect(response).toBe(redirectSpy.mock.results[0].value);
    });

    it('should return 401 if no session is found', async () => {
      mockedGetServerSession.mockResolvedValue(null);
      const response = await GET();
      const body = await response.json();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).not.toHaveBeenCalled();
      expect(redirectSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 404 if user is not found', async () => {
      mockedUserFindUnique.mockResolvedValue(null);
      const response = await GET();
      const body = await response.json();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).toHaveBeenCalledTimes(1);
      expect(redirectSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Contract URL not found');
    });

    it('should return 404 if user found but contractUrl is null', async () => {
      mockUser = {
        id: testUserId,
        contractUrl: null, // Simulate user without contract URL
      };
      mockedUserFindUnique.mockResolvedValue(mockUser as User);

      const response = await GET();
      const body = await response.json();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).toHaveBeenCalledTimes(1);
      expect(redirectSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Contract URL not found');
    });

    it('should return 500 if getServerSession fails', async () => {
      mockedGetServerSession.mockRejectedValue(new Error('Auth error'));
      const response = await GET();
      const body = await response.json();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).not.toHaveBeenCalled();
      expect(redirectSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch contract');
    });

    it('should return 500 if prisma.user.findUnique fails', async () => {
      mockedUserFindUnique.mockRejectedValue(new Error('DB error'));
      const response = await GET();
      const body = await response.json();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).toHaveBeenCalledTimes(1);
      expect(redirectSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch contract');
    });
  });
});
