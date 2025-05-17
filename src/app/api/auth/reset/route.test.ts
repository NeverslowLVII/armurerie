import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";
import type { SentMessageInfo } from "nodemailer";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, PUT } from "./route";

import { generateResetLink, verifyToken } from "@/lib/tokens";
import bcrypt from "bcryptjs";

vi.mock("@/lib/prisma", () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("@/lib/email", () => ({
	sendEmail: vi.fn(),
	generateResetPasswordEmailHtml: vi.fn((_resetLink: string) => {
		return "<p>Mock Reset Email HTML</p>";
	}),
}));

vi.mock("@/lib/tokens", () => ({
	generateResetLink: vi.fn(),
	verifyToken: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
	default: {
		hash: vi.fn(
			async (data: string | Buffer, _saltOrRounds: string | number) => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				return `hashed_${data.toString().substring(0, 10)}`;
			},
		),
	},
}));

type ResetRequestBody = { email: string } | { token: string; password: string };

const createMockRequest = (body: ResetRequestBody): NextRequest => {
	const req = {
		json: async () => body,
		headers: new Headers({ "Content-Type": "application/json" }),
		nextUrl: new URL("http://localhost/api/auth/reset"),
	} as unknown as NextRequest;
	return req;
};

import { generateResetPasswordEmailHtml, sendEmail } from "@/lib/email";

const mockedPrismaUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockedPrismaUserUpdate = vi.mocked(prisma.user.update);
const mockedSendEmail = vi.mocked(sendEmail);
const mockedGenerateResetLink = vi.mocked(generateResetLink);
const mockedVerifyToken = vi.mocked(verifyToken);
const mockedGenerateResetPasswordEmailHtml = vi.mocked(
	generateResetPasswordEmailHtml,
);
const mockedBcryptHash = vi.mocked(bcrypt.hash);

describe("/api/auth/reset Route Handlers", () => {
	let testUser: Partial<User>;
	const testEmail = "test@example.com";
	const testUserId = 1;
	const testPassword = "newSecurePassword123";
	const testToken = "valid-reset-token";

	beforeEach(() => {
		vi.resetAllMocks();

		testUser = {
			id: testUserId,
			email: testEmail,
			name: "Test User",
			password: "oldhashedpassword",
		};

		mockedPrismaUserFindUnique.mockResolvedValue(testUser as User);
		mockedGenerateResetLink.mockReturnValue(
			"http://localhost:3000/auth/reset?token=mock-token",
		);

		const mockSentInfo: SentMessageInfo = {
			messageId: "mock-message-id",
			envelope: { from: "mock@sender.com", to: [testEmail] },
			response: "250 OK: queued as MOCK_ID",
			accepted: [testEmail],
			rejected: [],
			pending: [],
			messageTime: 0,
			messageSize: 0,
		};
		mockedSendEmail.mockResolvedValue({ success: true, data: mockSentInfo });
		mockedVerifyToken.mockReturnValue({
			userId: testUserId,
			type: "reset",
			email: testEmail,
		});
		mockedPrismaUserUpdate.mockResolvedValue(testUser as User);
	});

	describe("POST Handler", () => {
		it("should return success and send email if user exists", async () => {
			const mockRequest = createMockRequest({ email: testEmail });

			const response = await POST(mockRequest);
			const body = await response.json();

			expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
				where: { email: testEmail },
			});
			expect(mockedGenerateResetLink).toHaveBeenCalledWith(
				testUserId,
				testEmail,
				expect.any(String),
			);

			expect(mockedGenerateResetPasswordEmailHtml).toHaveBeenCalled();

			expect(mockedSendEmail).toHaveBeenCalledWith({
				to: testEmail,
				subject: "Réinitialisation de votre mot de passe",
				html: "<p>Mock Reset Email HTML</p>",
			});
			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
		});

		it("should return success but NOT send email if user does NOT exist", async () => {
			mockedPrismaUserFindUnique.mockResolvedValue(null);
			const nonExistentEmail = "nobody@example.com";
			const mockRequest = createMockRequest({ email: nonExistentEmail });

			const response = await POST(mockRequest);
			const body = await response.json();

			expect(mockedPrismaUserFindUnique).toHaveBeenCalledWith({
				where: { email: nonExistentEmail },
			});
			expect(mockedGenerateResetLink).not.toHaveBeenCalled();
			expect(mockedSendEmail).not.toHaveBeenCalled();
			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
		});

		it("should return 500 error if prisma findUnique fails", async () => {
			const dbError = new Error("Database connection failed");
			mockedPrismaUserFindUnique.mockRejectedValue(dbError);
			const mockRequest = createMockRequest({ email: testEmail });

			const response = await POST(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe(
				"Erreur lors de la réinitialisation du mot de passe",
			);
		});

		it("should return 500 error if sendEmail fails", async () => {
			const emailError = new Error("SMTP server down");
			mockedSendEmail.mockRejectedValue(emailError);
			const mockRequest = createMockRequest({ email: testEmail });

			const response = await POST(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe(
				"Erreur lors de la réinitialisation du mot de passe",
			);
		});
	});

	describe("PUT Handler", () => {
		it("should update password successfully with valid token", async () => {
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

		it("should return 401 if token is invalid (verifyToken returns null)", async () => {
			mockedVerifyToken.mockReturnValue(null);
			const mockRequest = createMockRequest({
				token: "invalid-token",
				password: testPassword,
			});

			const response = await PUT(mockRequest);
			const body = await response.json();

			expect(mockedVerifyToken).toHaveBeenCalledWith("invalid-token");
			expect(mockedPrismaUserFindUnique).not.toHaveBeenCalled();
			expect(mockedBcryptHash).not.toHaveBeenCalled();
			expect(mockedPrismaUserUpdate).not.toHaveBeenCalled();
			expect(response.status).toBe(401);
			expect(body.error).toBe("Token invalide ou expiré");
		});

		it('should return 401 if token payload type is not "reset"', async () => {
			mockedVerifyToken.mockReturnValue({
				userId: testUserId,
				type: "setup" as const,
				email: testEmail,
			});
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
			expect(body.error).toBe("Token invalide ou expiré");
		});

		it("should return 404 if token is valid but user not found", async () => {
			mockedPrismaUserFindUnique.mockResolvedValue(null);
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
			expect(mockedBcryptHash).not.toHaveBeenCalled();
			expect(mockedPrismaUserUpdate).not.toHaveBeenCalled();
			expect(response.status).toBe(404);
			expect(body.error).toBe("Utilisateur non trouvé");
		});

		it("should return 500 error if bcrypt hash fails", async () => {
			const hashError = new Error("Hashing failed");
			mockedBcryptHash.mockRejectedValue(hashError);
			const mockRequest = createMockRequest({
				token: testToken,
				password: testPassword,
			});

			const response = await PUT(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe(
				"Erreur lors de la réinitialisation du mot de passe",
			);
		});

		it("should return 500 error if prisma update fails", async () => {
			const updateError = new Error("Database update failed");
			mockedPrismaUserUpdate.mockRejectedValue(updateError);
			const mockRequest = createMockRequest({
				token: testToken,
				password: testPassword,
			});

			const response = await PUT(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe(
				"Erreur lors de la réinitialisation du mot de passe",
			);
		});
	});
});
