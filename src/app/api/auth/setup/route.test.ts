import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route'; // Import the handler

// Mock dependencies
import { verifyToken } from '@/lib/tokens';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/tokens', () => ({
  verifyToken: vi.fn(),
}));

// Use the same bcrypt mock as in reset tests
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(
      async (data: string | Buffer, saltOrRounds: string | number) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return `hashed_${data.toString().substring(0, 10)}`;
      }
    ),
  },
}));

// Helper function to create a mock NextRequest
const createMockRequest = (body: any): NextRequest => {
  const req = {
    json: async () => body,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    nextUrl: new URL('http://localhost/api/auth/setup'),
  } as unknown as NextRequest;
  return req;
};

// Cast mocked functions for type safety
const mockedPrismaUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockedPrismaUserUpdate = vi.mocked(prisma.user.update);
const mockedVerifyToken = vi.mocked(verifyToken);
const mockedBcryptHash = vi.mocked(bcrypt.hash);

describe('/api/auth/setup POST Handler', () => {
  let testUser: Partial<User>;
  const testUserId = 2; // Use a different ID for clarity
  const testPassword = 'newSecurePassword456';
  const testToken = 'valid-setup-token';

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Define a default test user
    testUser = {
      id: testUserId,
      email: 'setup-user@example.com',
      name: 'Setup User',
      password: 'initial_placeholder_password', // Password before setup
    };

    // Default mock implementations
    mockedVerifyToken.mockReturnValue({
      userId: testUserId,
      type: 'setup',
      email: testUser.email || 'setup-user@example.com', // Provide fallback
    });
    mockedPrismaUserFindUnique.mockResolvedValue(testUser as User);
    mockedPrismaUserUpdate.mockResolvedValue(testUser as User);
  });

  it('should setup password successfully with valid token and user', async () => {
    const mockRequest = createMockRequest({
      token: testToken,
      password: testPassword,
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(mockedVerifyToken).toHaveBeenCalledWith(testToken);
    expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { id: testUserId },
    });
    expect(mockedBcryptHash).toHaveBeenCalledWith(testPassword, 10);
    expect(mockedPrismaUserUpdate).toHaveBeenCalledWith({
      where: { id: testUserId },
      data: {
        password: `hashed_${testPassword.substring(0, 10)}`,
        lastLogin: expect.any(Date),
      },
    });
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('should return 401 if token is invalid (verifyToken returns null)', async () => {
    mockedVerifyToken.mockReturnValue(null); // Simulate invalid token
    const mockRequest = createMockRequest({
      token: 'invalid-token',
      password: testPassword,
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(mockedVerifyToken).toHaveBeenCalledWith('invalid-token');
    expect(mockedPrismaUserFindUnique).not.toHaveBeenCalled();
    expect(mockedBcryptHash).not.toHaveBeenCalled();
    expect(mockedPrismaUserUpdate).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(body.error).toBe('Token invalide ou expiré');
  });

  it('should return 401 if token payload type is not "setup"', async () => {
    mockedVerifyToken.mockReturnValue({
      userId: testUserId,
      type: 'reset' as any,
      email: 'wrong@type.com',
    }); // Simulate wrong token type
    const mockRequest = createMockRequest({
      token: testToken,
      password: testPassword,
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(mockedVerifyToken).toHaveBeenCalledWith(testToken);
    expect(mockedPrismaUserFindUnique).not.toHaveBeenCalled();
    expect(mockedBcryptHash).not.toHaveBeenCalled();
    expect(mockedPrismaUserUpdate).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(body.error).toBe('Token invalide ou expiré');
  });

  it('should return 404 if token is valid but user not found', async () => {
    mockedPrismaUserFindUnique.mockResolvedValue(null); // Simulate user not found
    const mockRequest = createMockRequest({
      token: testToken,
      password: testPassword,
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(mockedVerifyToken).toHaveBeenCalledWith(testToken);
    expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { id: testUserId },
    });
    expect(mockedBcryptHash).not.toHaveBeenCalled();
    expect(mockedPrismaUserUpdate).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
    expect(body.error).toBe('Utilisateur non trouvé');
  });

  it('should return 500 error if bcrypt hash fails', async () => {
    const hashError = new Error('Hashing failed unexpectedly');
    // Need to ensure the mock is correctly targeted
    vi.mocked(bcrypt.hash).mockRejectedValue(hashError); // Re-cast inside test or ensure top-level cast is correct
    const mockRequest = createMockRequest({
      token: testToken,
      password: testPassword,
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(mockedVerifyToken).toHaveBeenCalledWith(testToken);
    expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { id: testUserId },
    });
    expect(mockedBcryptHash).toHaveBeenCalledWith(testPassword, 10);
    expect(mockedPrismaUserUpdate).not.toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(body.error).toBe('Erreur lors de la configuration du compte');
  });

  it('should return 500 error if prisma update fails', async () => {
    const updateError = new Error('DB update failed');
    mockedPrismaUserUpdate.mockRejectedValue(updateError); // Simulate update error
    const mockRequest = createMockRequest({
      token: testToken,
      password: testPassword,
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(mockedVerifyToken).toHaveBeenCalledWith(testToken);
    expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { id: testUserId },
    });
    expect(mockedBcryptHash).toHaveBeenCalledWith(testPassword, 10);
    expect(mockedPrismaUserUpdate).toHaveBeenCalled(); // It was called but failed
    expect(response.status).toBe(500);
    expect(body.error).toBe('Erreur lors de la configuration du compte');
  });
});
