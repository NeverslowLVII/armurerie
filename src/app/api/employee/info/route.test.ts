import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import type { Session } from 'next-auth';
// import { getServerSession } from 'next-auth/next'; // Implicitly handled by vi.mock
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Use vi.hoisted to ensure mockGetServerSessionFn is initialized before vi.mock factory runs
const { mockGetServerSessionFn } = vi.hoisted(() => {
  return { mockGetServerSessionFn: vi.fn() };
});

// Mock next-auth
vi.mock('next-auth/next', () => ({
  getServerSession: mockGetServerSessionFn,
}));

// Mock next/headers to prevent "called outside a request scope" error
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()), // Return a new Headers object
  cookies: vi.fn(() => new Map()), // Mock cookies if it were used directly
}));

// Mock @/lib/auth to provide minimal authOptions
vi.mock('@/lib/auth', () => ({
  authOptions: {
    providers: [], // No real providers needed for mock
    secret: process.env.NEXTAUTH_SECRET, // Use the env secret
    // Add other essential options if getServerSession complains
  },
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Cast the explicitly created mock function
const mockedGetServerSession = mockGetServerSessionFn;
// We don't need to mock authOptions directly now, as the module is mocked
const mockedUserFindUnique = vi.mocked(prisma.user.findUnique);

// Define a type for the expected user data shape returned by the API
type ExpectedUserInfo = {
  id: number;
  name: string | null;
  email: string | null;
  role: Role;
  contractUrl: string | null;
};

describe('/api/employee/info Route Handler', () => {
  const testUserId = 1;
  const testUserEmail = 'employee@example.com';
  const testUserName = 'Test Employee';
  const testUserRole = Role.EMPLOYEE;
  const testContractUrl = 'https://example.com/contract.pdf';

  let mockSession: Session | null;
  // Use Partial<User> for the data Prisma mock should return -- NO LONGER FULLY NEEDED for this specific mock
  // let mockUserDataForPrisma: Partial<User> | null;

  beforeEach(() => {
    vi.resetAllMocks();

    mockSession = {
      user: {
        id: String(testUserId),
        email: testUserEmail,
        name: testUserName,
        role: testUserRole,
        image: null,
      },
      expires: 'mock_expiry_date',
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    // No default implementation for mockedUserFindUnique here;
    // it will be set in specific tests or use vi.fn() default behavior (undefined).
  });

  // --- GET Handler Tests ---
  describe('GET Handler', () => {
    it('should return user info if session is valid and user exists', async () => {
      const expectedApiResult: ExpectedUserInfo = {
        id: testUserId,
        name: testUserName,
        email: testUserEmail,
        role: testUserRole,
        contractUrl: testContractUrl,
      };
      // Specific mock for this test case
      mockedUserFindUnique.mockResolvedValue(expectedApiResult as any as User);

      const response = await GET();
      const body = await response.json();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).toHaveBeenCalledWith({
        where: { email: testUserEmail },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          contractUrl: true,
        },
      });
      expect(response.status).toBe(200);
      expect(body).toEqual(expectedApiResult);
    });

    it('should return 401 if no session is found', async () => {
      mockedGetServerSession.mockResolvedValue(null);
      const response = await GET();
      const bodyText = await response.text();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(bodyText).toBe('Non autorisé');
    });

    it('should return 401 if session has no user email', async () => {
      mockSession = {
        user: {
          id: '1',
          name: 'Test',
          role: Role.EMPLOYEE,
          image: null /* email missing */,
        },
        expires: 'mock_expiry_date',
      };
      mockedGetServerSession.mockResolvedValue(mockSession);

      const response = await GET();
      const bodyText = await response.text();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(bodyText).toBe('Non autorisé');
    });

    it('should return 404 if user is not found in database', async () => {
      // Ensure this mock returns null, not the partial object
      mockedUserFindUnique.mockResolvedValue(null);
      const response = await GET();
      const bodyText = await response.text();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(404);
      expect(bodyText).toBe('Utilisateur non trouvé');
    });

    it('should return 500 if getServerSession throws an error', async () => {
      mockedGetServerSession.mockRejectedValue(new Error('Session error'));
      const response = await GET();
      const bodyText = await response.text();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).not.toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(bodyText).toBe('Erreur interne du serveur');
    });

    it('should return 500 if prisma.user.findUnique throws an error', async () => {
      mockedUserFindUnique.mockRejectedValue(new Error('DB error'));
      const response = await GET();
      const bodyText = await response.text();

      expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockedUserFindUnique).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(500);
      expect(bodyText).toBe('Erreur interne du serveur');
    });
  });
});
