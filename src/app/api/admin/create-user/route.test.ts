import { prisma } from '@/lib/prisma'; // For cleanup
import { Role } from '@/services/api'; // For assertions type safety/enum access
import type { User } from '@prisma/client'; // For typing if needed
import { getServerSession } from 'next-auth/next'; // Import the function to be mocked
import type { NextRequest } from 'next/server'; // Needed for mocking Request
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route'; // Import the handler function

// Mock the next-auth/next module
vi.mock('next-auth/next');
const mockedGetServerSession = vi.mocked(getServerSession);

// Import types for middleware mocking - NO LONGER NEEDED
/*
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
*/

// Mock the next-auth/middleware - NO LONGER NEEDED
/*
vi.mock('next-auth/middleware', () => ({
    // Mock withAuth with a simplified signature
    withAuth: (
        middlewareFunction: (req: NextRequestWithAuth) => any,
    ) => {
        // Return a function that directly bypasses the middleware
        return (req: NextRequest) => {
            return NextResponse.next();
        };
    },
}));
*/

// Assuming dev server runs on localhost:3000 or configured via env - NO LONGER RELEVANT
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
// const CREATE_USER_URL = `${API_BASE_URL}/admin/create-user`;

// Helper function to create a mock NextRequest
// Defined *before* the describe block to avoid TDZ issues
const createMockRequest = (body: any): NextRequest => {
  const req = {
    json: async () => body,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    nextUrl: new URL('http://localhost/api/admin/create-user'),
  } as unknown as NextRequest;
  return req;
};

// Helper to generate unique data
const generateUniqueEmail = () => `test-user-${Date.now()}@integration.test`;
const generateUniqueName = () => `Test User ${Date.now()}`;

let createdUserIds: number[] = []; // Store IDs for cleanup (Assuming User ID is number)

describe(`Unit/Integration Test for POST Handler: /api/admin/create-user`, () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    mockedGetServerSession.mockReset();
  });

  afterAll(async () => {
    // Clean up all users created during the tests
    if (createdUserIds.length > 0) {
      console.log(`Cleaning up ${createdUserIds.length} test users...`);
      try {
        // DeleteMany might be more efficient if many users are created
        // but individual deletes are safer if some creations failed partially.
        for (const userId of createdUserIds) {
          await prisma.user.delete({
            where: { id: userId }, // Should now match Prisma's expected type
          });
        }
        console.log(`Cleaned up users: ${createdUserIds.join(', ')}`);
        createdUserIds = []; // Reset the array
      } catch (error) {
        console.error(`Error cleaning up test users:`, error);
        // Optionally try finding users by email pattern if IDs are missing
        const cleanupAttempt = await prisma.user.deleteMany({
          where: { email: { endsWith: '@integration.test' } },
        });
        console.warn(
          `Attempted pattern cleanup, deleted: ${cleanupAttempt.count}`
        );
      }
    }
  });

  // --- Authentication Note ---
  // Tests now use vi.mock to simulate getServerSession responses directly within the handler call.

  it('should create a new EMPLOYEE user successfully when called by a PATRON', async () => {
    // Simulate PATRON session
    mockedGetServerSession.mockResolvedValue({
      user: {
        id: 'test-patron-id',
        email: 'patron@test.com',
        role: Role.PATRON,
        name: 'Test Patron',
      },
      expires: 'some-future-date', // Required by Session type, value doesn't matter here
    });

    const uniqueEmail = generateUniqueEmail();
    const uniqueName = generateUniqueName();
    const payload = {
      name: uniqueName,
      email: uniqueEmail,
      password: 'password123$', // Use a slightly more complex password
      color: '#00FF00',
      contractUrl: `http://example.com/contracts/${uniqueName}.pdf`,
      commission: 15.0,
    };

    // Create mock request
    const mockRequest = createMockRequest(payload);

    // Call the handler directly
    const response = await POST(mockRequest);

    // Log response body for debugging if status is not 200
    // Check status directly on the NextResponse object
    if (response.status !== 200) {
      try {
        // NextResponse.json() returns the body, no need for text() first if expecting JSON
        const errorBody = await response.json();
        console.error(
          `[FAIL] Status: ${response.status}, Body: ${JSON.stringify(errorBody).substring(0, 500)}`
        );
      } catch {
        console.error(
          `[FAIL] Status: ${response.status}, Failed to parse JSON body or read body`
        );
      }
    }

    expect(response.status, `Expected 200 OK, got ${response.status}`).toBe(
      200
    );

    const responseBody = await response.json(); // Should be safe now

    expect(responseBody.success).toBe(true);
    expect(responseBody.user).toBeDefined();
    expect(responseBody.user.id).toBeDefined();
    expect(responseBody.user.name).toBe(uniqueName);
    expect(responseBody.user.email).toBe(uniqueEmail);
    expect(responseBody.user.role).toBe(Role.EMPLOYEE); // Verify the role is set correctly
    expect(responseBody.user.contractUrl).toBe(payload.contractUrl);
    expect(responseBody.user.commission).toBe(payload.commission);
    // Password should obviously not be returned

    // Store ID for cleanup
    if (responseBody.user.id) {
      createdUserIds.push(responseBody.user.id);
    }

    // Optional: Direct DB verification
    const dbUser = await prisma.user.findUnique({
      where: { id: responseBody.user.id },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.name).toBe(uniqueName);
    expect(dbUser?.email).toBe(uniqueEmail);
    expect(dbUser?.role).toBe(Role.EMPLOYEE);
    expect(dbUser?.color).toBe(payload.color);
    expect(dbUser?.contractUrl).toBe(payload.contractUrl);
    expect(dbUser?.commission).toBe(payload.commission);
    // Verify password was hashed (cannot check exact hash easily, but check it's not plaintext)
    expect(dbUser?.password).toBeDefined();
    expect(dbUser?.password).not.toBe(payload.password);
    expect(dbUser?.password?.length).toBeGreaterThan(payload.password.length); // Basic check
  });

  it('should return 400 if required fields (name, email, password) are missing', async () => {
    // Simulate PATRON session (as validation happens after auth check)
    mockedGetServerSession.mockResolvedValue({
      user: {
        id: 'test-patron-id',
        email: 'patron@test.com',
        role: Role.PATRON,
        name: 'Test Patron',
      },
      expires: 'some-future-date',
    });

    const basePayload = {
      name: generateUniqueName(),
      email: generateUniqueEmail(),
      password: 'password123',
    };

    const testCases = [
      { ...basePayload, name: undefined }, // Missing name
      { ...basePayload, email: undefined }, // Missing email
      { ...basePayload, password: undefined }, // Missing password
      { name: generateUniqueName() }, // Missing email and password
      {}, // Missing all
    ];

    for (const payload of testCases) {
      const mockRequest = createMockRequest(payload);
      const response = await POST(mockRequest);

      expect(
        response.status,
        `Expected 400 for payload: ${JSON.stringify(payload)}`
      ).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Missing required fields');
    }
  });

  it('should return 400 if email already exists', async () => {
    // Simulate PATRON session
    mockedGetServerSession.mockResolvedValue({
      user: {
        id: 'test-patron-id',
        email: 'patron@test.com',
        role: Role.PATRON,
        name: 'Test Patron',
      },
      expires: 'some-future-date',
    });

    const existingEmail = generateUniqueEmail();
    const initialPayload = {
      name: generateUniqueName(),
      email: existingEmail,
      password: 'passwordInitial123',
    };

    // 1. Create the first user
    const initialMockRequest = createMockRequest(initialPayload);
    const createResponse = await POST(initialMockRequest);

    // Log response body for debugging if status is not 200
    if (createResponse.status !== 200) {
      try {
        const errorBody = await createResponse.json();
        console.error(
          `[FAIL Initial Create] Status: ${createResponse.status}, Body: ${JSON.stringify(errorBody).substring(0, 500)}`
        );
      } catch {
        console.error(
          `[FAIL Initial Create] Status: ${createResponse.status}, Failed to read body`
        );
      }
    }
    expect(createResponse.status, 'Initial user creation failed').toBe(200);
    const createBody = await createResponse.json();
    const tempUserId = createBody.user.id;
    if (tempUserId) {
      createdUserIds.push(tempUserId);
    }

    // 2. Attempt to create another user with the same email
    const duplicatePayload = {
      name: generateUniqueName(),
      email: existingEmail,
      password: 'passwordDuplicate456',
    };

    const duplicateMockRequest = createMockRequest(duplicatePayload);
    const response = await POST(duplicateMockRequest);

    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Email already exists');
  });

  it('should return 403 if the requesting user does not have PATRON role', async () => {
    // Simulate non-PATRON (e.g., EMPLOYEE) session
    mockedGetServerSession.mockResolvedValue({
      user: {
        id: 'test-employee-id',
        email: 'employee@test.com',
        role: Role.EMPLOYEE,
        name: 'Test Employee',
      },
      expires: 'some-future-date',
    });

    const payload = {
      name: generateUniqueName(),
      email: generateUniqueEmail(),
      password: 'password123',
    };

    const mockRequest = createMockRequest(payload);
    const response = await POST(mockRequest);

    // The route handler explicitly checks for PATRON and returns 403.
    expect(response.status).toBe(403);
    const responseBody = await response.json();
    // Match the specific error message from the route handler
    expect(responseBody.error).toBe(
      'Unauthorized - Only PATRON can create user accounts'
    );
  });

  it('should return 403 if no authentication is provided', async () => {
    // Simulate no session (unauthenticated)
    mockedGetServerSession.mockResolvedValue(null);

    const payload = {
      name: generateUniqueName(),
      email: generateUniqueEmail(),
      password: 'password123',
    };

    const mockRequest = createMockRequest(payload);
    const response = await POST(mockRequest);

    // If getServerSession returns null, the route handler's check `!session || session.user.role !== 'PATRON'`
    // should trigger, resulting in a 403 Forbidden response directly from the route handler logic.
    expect(response.status).toBe(403);
    const responseBody = await response.json();
    expect(responseBody.error).toBe(
      'Unauthorized - Only PATRON can create user accounts'
    );
  });
});
