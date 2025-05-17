import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import { Role } from "@prisma/client";
import type { Session } from "next-auth";

import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const { mockGetServerSessionFn } = vi.hoisted(() => {
	return { mockGetServerSessionFn: vi.fn() };
});

vi.mock("next-auth/next", () => ({
	getServerSession: mockGetServerSessionFn,
}));

vi.mock("next/headers", () => ({
	headers: vi.fn(() => new Headers()),
	cookies: vi.fn(() => new Map()),
}));

vi.mock("@/lib/auth", () => ({
	authOptions: {
		providers: [],
		secret: process.env.NEXTAUTH_SECRET,
	},
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
		},
	},
}));

const mockedGetServerSession = mockGetServerSessionFn;

const mockedUserFindUnique = vi.mocked(prisma.user.findUnique);

type ExpectedUserInfo = {
	id: number;
	name: string | null;
	email: string | null;
	role: Role;
	contractUrl: string | null;
};

describe("/api/employee/info Route Handler", () => {
	const testUserId = 1;
	const testUserEmail = "employee@example.com";
	const testUserName = "Test Employee";
	const testUserRole = Role.EMPLOYEE;
	const testContractUrl = "https://example.com/contract.pdf";

	let mockSession: Session | null;

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
			expires: "mock_expiry_date",
		};
		mockedGetServerSession.mockResolvedValue(mockSession);
	});

	describe("GET Handler", () => {
		it("should return user info if session is valid and user exists", async () => {
			const expectedApiResult: ExpectedUserInfo = {
				id: testUserId,
				name: testUserName,
				email: testUserEmail,
				role: testUserRole,
				contractUrl: testContractUrl,
			};

			mockedUserFindUnique.mockResolvedValue(expectedApiResult as User);

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

		it("should return 401 if no session is found", async () => {
			mockedGetServerSession.mockResolvedValue(null);
			const response = await GET();
			const bodyText = await response.text();

			expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
			expect(mockedUserFindUnique).not.toHaveBeenCalled();
			expect(response.status).toBe(401);
			expect(bodyText).toBe("Non autorisé");
		});

		it("should return 401 if session has no user email", async () => {
			mockSession = {
				user: {
					id: "1",
					name: "Test",
					role: Role.EMPLOYEE,
					image: null,
				},
				expires: "mock_expiry_date",
			};
			mockedGetServerSession.mockResolvedValue(mockSession);

			const response = await GET();
			const bodyText = await response.text();

			expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
			expect(mockedUserFindUnique).not.toHaveBeenCalled();
			expect(response.status).toBe(401);
			expect(bodyText).toBe("Non autorisé");
		});

		it("should return 404 if user is not found in database", async () => {
			mockedUserFindUnique.mockResolvedValue(null);
			const response = await GET();
			const bodyText = await response.text();

			expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
			expect(mockedUserFindUnique).toHaveBeenCalledTimes(1);
			expect(response.status).toBe(404);
			expect(bodyText).toBe("Utilisateur non trouvé");
		});

		it("should return 500 if getServerSession throws an error", async () => {
			mockedGetServerSession.mockRejectedValue(new Error("Session error"));
			const response = await GET();
			const bodyText = await response.text();

			expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
			expect(mockedUserFindUnique).not.toHaveBeenCalled();
			expect(response.status).toBe(500);
			expect(bodyText).toBe("Erreur interne du serveur");
		});

		it("should return 500 if prisma.user.findUnique throws an error", async () => {
			mockedUserFindUnique.mockRejectedValue(new Error("DB error"));
			const response = await GET();
			const bodyText = await response.text();

			expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
			expect(mockedUserFindUnique).toHaveBeenCalledTimes(1);
			expect(response.status).toBe(500);
			expect(bodyText).toBe("Erreur interne du serveur");
		});
	});
});
