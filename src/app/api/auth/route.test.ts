import { verifyAuthTokenAndGetUser } from "@/features/auth/services/authUtils";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
	prisma: {
		user: {
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("bcryptjs", () => ({
	default: {
		compare: vi.fn(),
	},
}));

vi.mock("jsonwebtoken", () => ({
	default: {
		sign: vi.fn(),
		verify: vi.fn(),
	},
}));

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

type AuthRequestBody = {
	email?: string;
	username?: string;
	password: string;
};

const createMockPostRequest = (body: AuthRequestBody): NextRequest => {
	const req = {
		json: async () => body,
		headers: new Headers({ "Content-Type": "application/json" }),
		nextUrl: new URL("http://localhost/api/auth"),
	} as unknown as NextRequest;
	return req;
};

const mockedPrismaUserFindFirst = vi.mocked(prisma.user.findFirst);
const mockedPrismaUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockedPrismaUserUpdate = vi.mocked(prisma.user.update);
const mockedBcryptCompare = vi.mocked(bcrypt.compare);
const mockedJwtSign = vi.mocked(jwt.sign);
const mockedJwtVerify = vi.mocked(jwt.verify);

const jsonSpy = vi.spyOn(NextResponse, "json");
const setCookieSpy = vi.fn();

describe("/api/auth Route Handlers", () => {
	let testUser: User;
	const testEmail = "test@example.com";
	const testUsername = "testuser";
	const testPassword = "password123";
	const testUserId = 1;
	const testToken = "mock-jwt-token";

	beforeEach(async () => {
		vi.resetAllMocks();
		jsonSpy.mockClear();
		setCookieSpy.mockClear();

		testUser = {
			id: testUserId,
			email: testEmail,
			username: testUsername,
			password: "hashedpassword",
			name: "Test User",
			role: "EMPLOYEE",
			color: "#FFFFFF",
			contractUrl: null,
			commission: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLogin: null,
			deleted: false,
			deletedAt: null,
		};

		mockedPrismaUserFindFirst.mockResolvedValue(testUser);

		mockedBcryptCompare.mockImplementation(() => Promise.resolve(true));
		mockedPrismaUserUpdate.mockResolvedValue(testUser);

		mockedJwtSign.mockImplementation(() => testToken);

		mockedJwtVerify.mockImplementation(() => ({
			id: testUserId,
			email: testEmail,
			username: testUsername,
			role: testUser.role,
			name: testUser.name,
		}));
		mockedPrismaUserFindUnique.mockResolvedValue(testUser);

		jsonSpy.mockImplementation((body, init) => {
			const response = new NextResponse(JSON.stringify(body), init);

			Object.defineProperty(response, "cookies", {
				value: {
					set: setCookieSpy,
				},
				writable: true,
				configurable: true,
			});

			return response;
		});
	});

	describe("POST Handler (Login)", () => {
		it("should login successfully with email and set cookie", async () => {
			const mockRequest = createMockPostRequest({
				email: testEmail,
				password: testPassword,
			});
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(mockedPrismaUserFindFirst).toHaveBeenCalledWith({
				where: { OR: [{ email: testEmail }, { username: "" }] },
			});
			expect(mockedBcryptCompare).toHaveBeenCalledWith(
				testPassword,
				testUser.password,
			);
			expect(mockedPrismaUserUpdate).toHaveBeenCalledWith({
				where: { id: testUserId },
				data: { lastLogin: expect.any(Date) },
			});
			expect(mockedJwtSign).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(String),
				{ expiresIn: "24h" },
			);
			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.user.id).toBe(testUserId);
			expect(body.user.email).toBe(testEmail);

			expect(setCookieSpy).toHaveBeenCalledWith(
				"auth_token",
				testToken,
				expect.objectContaining({ httpOnly: true, maxAge: 86400 }),
			);
		});

		it("should login successfully with username and set cookie", async () => {
			const mockRequest = createMockPostRequest({
				username: testUsername,
				password: testPassword,
			});
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(mockedPrismaUserFindFirst).toHaveBeenCalledWith({
				where: { OR: [{ email: "" }, { username: testUsername }] },
			});
			// ... other checks similar to email login ...
			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.user.username).toBe(testUsername);
			expect(setCookieSpy).toHaveBeenCalledWith(
				"auth_token",
				testToken,
				expect.any(Object),
			);
		});

		it("should return 401 if user not found", async () => {
			mockedPrismaUserFindFirst.mockResolvedValue(null);
			const mockRequest = createMockPostRequest({
				email: "notfound@example.com",
				password: testPassword,
			});
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(401);
			expect(body.error).toBe("Invalid credentials");
			expect(setCookieSpy).not.toHaveBeenCalled();
		});

		it("should return 401 if password comparison fails", async () => {
			mockedBcryptCompare.mockImplementation(() => Promise.resolve(false));
			const mockRequest = createMockPostRequest({
				email: testEmail,
				password: "wrongpassword",
			});
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(401);
			expect(body.error).toBe("Invalid credentials");
			expect(setCookieSpy).not.toHaveBeenCalled();
		});

		it("should return 500 if prisma findFirst fails", async () => {
			mockedPrismaUserFindFirst.mockRejectedValue(new Error("DB error"));
			const mockRequest = createMockPostRequest({
				email: testEmail,
				password: testPassword,
			});
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe("Authentication failed");
			expect(setCookieSpy).not.toHaveBeenCalled();
		});
		it("should return 500 if bcrypt compare fails", async () => {
			mockedBcryptCompare.mockImplementation(() => {
				throw new Error("Compare error");
			});
			const mockRequest = createMockPostRequest({
				email: testEmail,
				password: testPassword,
			});
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe("Authentication failed");
		});

		it("should return 500 if prisma update fails", async () => {
			mockedPrismaUserUpdate.mockRejectedValue(new Error("Update error"));
			const mockRequest = createMockPostRequest({
				email: testEmail,
				password: testPassword,
			});
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe("Authentication failed");
		});
	});

	describe("verifyAuthTokenAndGetUser Function", () => {
		it("should return user info for a valid token", async () => {
			const result = await verifyAuthTokenAndGetUser(testToken);

			expect(mockedJwtVerify).toHaveBeenCalledWith(
				testToken,
				expect.any(String),
			);
			expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
				where: { id: testUserId },
				select: expect.any(Object),
			});
			expect(result.status).toBe(200);
			expect(result.user?.id).toBe(testUserId);
			expect(result.user?.email).toBe(testEmail);
			expect(result.error).toBeUndefined();
		});

		it("should return 401 if token is undefined", async () => {
			const result = await verifyAuthTokenAndGetUser(undefined);

			expect(mockedJwtVerify).not.toHaveBeenCalled();
			expect(mockedPrismaUserFindUnique).not.toHaveBeenCalled();
			expect(result.status).toBe(401);
			expect(result.error).toBe("Unauthorized");
			expect(result.user).toBeUndefined();
		});

		it("should return 401 if jwt verify fails", async () => {
			mockedJwtVerify.mockImplementation(() => {
				throw new Error("Invalid signature");
			});
			const result = await verifyAuthTokenAndGetUser(testToken);

			expect(mockedJwtVerify).toHaveBeenCalledWith(
				testToken,
				expect.any(String),
			);
			expect(mockedPrismaUserFindUnique).not.toHaveBeenCalled();
			expect(result.status).toBe(401);
			expect(result.error).toBe("Invalid token");
			expect(result.user).toBeUndefined();
		});

		it("should return 401 if user from token not found in DB", async () => {
			mockedPrismaUserFindUnique.mockResolvedValue(null);
			const result = await verifyAuthTokenAndGetUser(testToken);

			expect(mockedJwtVerify).toHaveBeenCalledWith(
				testToken,
				expect.any(String),
			);
			expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
				where: { id: testUserId },
				select: expect.any(Object),
			});
			expect(result.status).toBe(401);
			expect(result.error).toBe("Invalid token");
			expect(result.user).toBeUndefined();
		});

		it("should return 401 if prisma findUnique fails unexpectedly", async () => {
			mockedPrismaUserFindUnique.mockRejectedValue(new Error("DB error"));
			const result = await verifyAuthTokenAndGetUser(testToken);

			expect(mockedJwtVerify).toHaveBeenCalledWith(
				testToken,
				expect.any(String),
			);
			expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
				where: { id: testUserId },
				select: expect.any(Object),
			});
			expect(result.status).toBe(401);
			expect(result.error).toBe("Invalid token");
			expect(result.user).toBeUndefined();
		});
	});
});
