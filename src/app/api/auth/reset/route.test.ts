import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';
import type { NextRequest } from 'next/server';
import type { SentMessageInfo } from 'nodemailer'; // Assuming nodemailer type
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, PUT } from './route'; // Import the handlers

// Hoist mocks for email - REMOVED
/*
const { sendEmail, generateResetPasswordEmailHtml } = vi.hoisted(() => { ... });
*/

// Mock dependencies
// import { generateResetPasswordEmailHtml, sendEmail } from '@/lib/email'; // Not needed
import { generateResetLink, verifyToken } from '@/lib/tokens';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      // Add other methods if needed
    },
    // Mock other models if needed
  },
}));

// Mock the actual module path, providing explicit mocks for both functions
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  generateResetPasswordEmailHtml: vi.fn((resetLink: string) => {
    console.log(
      `NEW Mock generateResetPasswordEmailHtml called with link: ${resetLink}`
    );
    return '<p>Mock Reset Email HTML</p>'; // Explicitly return the value
  }),
}));

vi.mock('@/lib/tokens', () => ({
  generateResetLink: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  // Provide a default export containing the mocked functions
  default: {
    hash: vi.fn(
      async (data: string | Buffer, saltOrRounds: string | number) => {
        // Simulate async hashing
        await new Promise((resolve) => setTimeout(resolve, 1)); // tiny delay
        return `hashed_${data.toString().substring(0, 10)}`; // Return a predictable mock hash
      }
    ),
    // Add compare if needed: compare: vi.fn().mockResolvedValue(true)
  },
}));

// Helper function to create a mock NextRequest (copied from create-user test)
const createMockRequest = (body: any): NextRequest => {
  const req = {
    json: async () => body,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    nextUrl: new URL('http://localhost/api/auth/reset'), // Adjust URL if necessary
  } as unknown as NextRequest;
  return req;
};

// Need to re-import the mocked functions to cast them
import { generateResetPasswordEmailHtml, sendEmail } from '@/lib/email';

// Cast mocked functions for type safety
const mockedPrismaUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockedPrismaUserUpdate = vi.mocked(prisma.user.update);
const mockedSendEmail = vi.mocked(sendEmail); // Cast the imported mock
const mockedGenerateResetLink = vi.mocked(generateResetLink);
const mockedVerifyToken = vi.mocked(verifyToken);
const mockedGenerateResetPasswordEmailHtml = vi.mocked(
  generateResetPasswordEmailHtml
); // Cast the imported mock
const mockedBcryptHash = vi.mocked(bcrypt.hash);

describe('/api/auth/reset Route Handlers', () => {
  let testUser: Partial<User>; // Use Partial for flexibility in mocks
  const testEmail = 'test@example.com';
  const testUserId = 1; // Assuming ID is number based on previous test
  const testPassword = 'newSecurePassword123';
  const testToken = 'valid-reset-token';

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Define a default test user
    testUser = {
      id: testUserId,
      email: testEmail,
      name: 'Test User',
      password: 'oldhashedpassword',
      // Add other fields as necessary based on your User model
    };

    // Default mock implementations (can be overridden in specific tests)
    mockedPrismaUserFindUnique.mockResolvedValue(testUser as User);
    mockedGenerateResetLink.mockReturnValue(
      'http://localhost:3000/auth/reset?token=mock-token'
    );
    // Fix: Provide a mock object matching SentMessageInfo structure
    const mockSentInfo: SentMessageInfo = {
      messageId: 'mock-message-id',
      envelope: { from: 'mock@sender.com', to: [testEmail] },
      response: '250 OK: queued as MOCK_ID',
      accepted: [testEmail],
      rejected: [],
      pending: [],
      messageTime: 0, // Simplified
      messageSize: 0, // Simplified
    };
    mockedSendEmail.mockResolvedValue({ success: true, data: mockSentInfo });
    mockedVerifyToken.mockReturnValue({
      userId: testUserId,
      type: 'reset',
      email: testEmail,
    });
    mockedPrismaUserUpdate.mockResolvedValue(testUser as User);
  });

  // No afterAll needed for cleanup if we fully mock prisma

  describe('POST Handler', () => {
    it('should return success and send email if user exists', async () => {
      const mockRequest = createMockRequest({ email: testEmail });

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
      expect(mockedGenerateResetLink).toHaveBeenCalledWith(
        testUserId,
        testEmail,
        expect.any(String)
      ); // Base URL might vary

      // Check if the HTML generator mock was called
      expect(mockedGenerateResetPasswordEmailHtml).toHaveBeenCalled();

      expect(mockedSendEmail).toHaveBeenCalledWith({
        to: testEmail,
        subject: 'Réinitialisation de votre mot de passe',
        html: '<p>Mock Reset Email HTML</p>',
      });
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should return success but NOT send email if user does NOT exist', async () => {
      mockedPrismaUserFindUnique.mockResolvedValue(null); // Override default mock
      const nonExistentEmail = 'nobody@example.com';
      const mockRequest = createMockRequest({ email: nonExistentEmail });

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: nonExistentEmail },
      });
      expect(mockedGenerateResetLink).not.toHaveBeenCalled();
      expect(mockedSendEmail).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true); // Security: always return success
    });

    it('should return 500 error if prisma findUnique fails', async () => {
      const dbError = new Error('Database connection failed');
      mockedPrismaUserFindUnique.mockRejectedValue(dbError); // Simulate DB error
      const mockRequest = createMockRequest({ email: testEmail });

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe(
        'Erreur lors de la réinitialisation du mot de passe'
      );
    });

    it('should return 500 error if sendEmail fails', async () => {
      const emailError = new Error('SMTP server down');
      mockedSendEmail.mockRejectedValue(emailError); // Simulate email error
      const mockRequest = createMockRequest({ email: testEmail });

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe(
        'Erreur lors de la réinitialisation du mot de passe'
      );
    });
  });

  describe('PUT Handler', () => {
    it('should update password successfully with valid token', async () => {
      const mockRequest = createMockRequest({
        token: testToken,
        password: testPassword,
      });

      const response = await PUT(mockRequest);
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

      const response = await PUT(mockRequest);
      const body = await response.json();

      expect(mockedVerifyToken).toHaveBeenCalledWith('invalid-token');
      expect(mockedPrismaUserFindUnique).not.toHaveBeenCalled();
      expect(mockedBcryptHash).not.toHaveBeenCalled();
      expect(mockedPrismaUserUpdate).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(body.error).toBe('Token invalide ou expiré');
    });

    it('should return 401 if token payload type is not "reset"', async () => {
      mockedVerifyToken.mockReturnValue({
        userId: testUserId,
        type: 'verify' as any,
        email: testEmail,
      }); // Simulate wrong token type
      const mockRequest = createMockRequest({
        token: testToken,
        password: testPassword,
      });

      const response = await PUT(mockRequest);
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

      const response = await PUT(mockRequest);
      const body = await response.json();

      expect(mockedVerifyToken).toHaveBeenCalledWith(testToken);
      expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { id: testUserId },
      });
      expect(mockedBcryptHash).not.toHaveBeenCalled(); // Should not proceed to hashing
      expect(mockedPrismaUserUpdate).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Utilisateur non trouvé');
    });

    it('should return 500 error if bcrypt hash fails', async () => {
      const hashError = new Error('Hashing failed');
      mockedBcryptHash.mockRejectedValue(hashError); // Simulate hashing error
      const mockRequest = createMockRequest({
        token: testToken,
        password: testPassword,
      });

      const response = await PUT(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe(
        'Erreur lors de la réinitialisation du mot de passe'
      );
    });

    it('should return 500 error if prisma update fails', async () => {
      const updateError = new Error('Database update failed');
      mockedPrismaUserUpdate.mockRejectedValue(updateError); // Simulate update error
      const mockRequest = createMockRequest({
        token: testToken,
        password: testPassword,
      });

      const response = await PUT(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe(
        'Erreur lors de la réinitialisation du mot de passe'
      );
    });
  });
});
