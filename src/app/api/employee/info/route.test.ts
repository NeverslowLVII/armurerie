import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Mock next-auth explicitly returning the mock function
const mockGetServerSessionFn = vi.fn();
vi.mock('next-auth/next', () => ({
  getServerSession: mockGetServerSessionFn,
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
  // Use Partial<User> for the data Prisma mock should return
  let mockUserDataForPrisma: Partial<User> | null;

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
    // This is the data Prisma's findUnique should resolve with
    // Include necessary fields + others as null/default to satisfy Partial<User>
    mockUserDataForPrisma = {
      id: testUserId,
      email: testUserEmail,
      name: testUserName,
      role: testUserRole,
      contractUrl: testContractUrl,
      // Add other potentially required fields as null/defaults
      username: null,
      password: 'hashedpassword', // Needs a value, content doesn't matter
      color: null,
      lastLogin: null,
      createdAt: new Date(), // Needs a value
      updatedAt: new Date(), // Needs a value
      deleted: false,
      deletedAt: null,
      commission: 0,
    };

    mockedGetServerSession.mockResolvedValue(mockSession);
    // Mock findUnique to return the partial user object, cast as User
    mockedUserFindUnique.mockResolvedValue(mockUserDataForPrisma as User);
  });

  // --- GET Handler Tests ---
  describe('GET Handler', () => {
    it('should return user info if session is valid and user exists', async () => {
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
      // Assert against the expected shape, ignoring extra fields from mockUserDataForPrisma
      const expectedBody: ExpectedUserInfo = {
        id: testUserId,
        name: testUserName,
        email: testUserEmail,
        role: testUserRole,
        contractUrl: testContractUrl,
      };
      expect(body).toEqual(expectedBody);
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
