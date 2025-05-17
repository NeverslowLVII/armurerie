import { prisma } from "@/lib/prisma";
import { Role } from "@/services/api";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import type { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("next-auth/next");
const mockedGetServerSession = vi.mocked(getServerSession);

type CreateUserRequestBody = Partial<
	Pick<
		Prisma.UserCreateInput,
		"name" | "email" | "password" | "color" | "contractUrl" | "commission"
	>
>;

const createMockRequest = (body: CreateUserRequestBody): NextRequest => {
	const req = {
		json: async () => body,
		headers: new Headers({ "Content-Type": "application/json" }),
		nextUrl: new URL("http://localhost/api/admin/create-user"),
	} as unknown as NextRequest;
	return req;
};

const generateUniqueEmail = () => `test-user-${Date.now()}@integration.test`;
const generateUniqueName = () => `Test User ${Date.now()}`;

let createdUserIds: number[] = [];

describe("Unit/Integration Test for POST Handler: /api/admin/create-user", () => {
	beforeEach(() => {
		mockedGetServerSession.mockReset();
	});

	afterAll(async () => {
		if (createdUserIds.length > 0) {
			try {
				for (const userId of createdUserIds) {
					await prisma.user.delete({
						where: { id: userId },
					});
				}
				createdUserIds = [];
			} catch (error) {
				console.error("Error cleaning up test users:", error);

				const cleanupAttempt = await prisma.user.deleteMany({
					where: { email: { endsWith: "@integration.test" } },
				});
				console.warn(
					`Attempted pattern cleanup, deleted: ${cleanupAttempt.count}`,
				);
			}
		}
	});

	it("should create a new EMPLOYEE user successfully when called by a PATRON", async () => {
		mockedGetServerSession.mockResolvedValue({
			user: {
				id: "test-patron-id",
				email: "patron@test.com",
				role: Role.PATRON,
				name: "Test Patron",
			},
			expires: "some-future-date",
		});

		const uniqueEmail = generateUniqueEmail();
		const uniqueName = generateUniqueName();
		const payload = {
			name: uniqueName,
			email: uniqueEmail,
			password: "password123$",
			color: "#00FF00",
			contractUrl: `http://example.com/contracts/${uniqueName}.pdf`,
			commission: 15.0,
		};

		const mockRequest = createMockRequest(payload);

		const response = await POST(mockRequest);

		if (response.status !== 200) {
			try {
				const errorBody = await response.json();
				console.error(
					`[FAIL] Status: ${response.status}, Body: ${JSON.stringify(errorBody).substring(0, 500)}`,
				);
			} catch {
				console.error(
					`[FAIL] Status: ${response.status}, Failed to parse JSON body or read body`,
				);
			}
		}

		expect(response.status, `Expected 200 OK, got ${response.status}`).toBe(
			200,
		);

		const responseBody = await response.json();

		expect(responseBody.success).toBe(true);
		expect(responseBody.user).toBeDefined();
		expect(responseBody.user.id).toBeDefined();
		expect(responseBody.user.name).toBe(uniqueName);
		expect(responseBody.user.email).toBe(uniqueEmail);
		expect(responseBody.user.role).toBe(Role.EMPLOYEE);
		expect(responseBody.user.contractUrl).toBe(payload.contractUrl);
		expect(responseBody.user.commission).toBe(payload.commission);

		if (responseBody.user.id) {
			createdUserIds.push(responseBody.user.id);
		}

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

		expect(dbUser?.password).toBeDefined();
		expect(dbUser?.password).not.toBe(payload.password);
		expect(dbUser?.password?.length).toBeGreaterThan(payload.password.length);
	});

	it("should return 400 if required fields (name, email, password) are missing", async () => {
		mockedGetServerSession.mockResolvedValue({
			user: {
				id: "test-patron-id",
				email: "patron@test.com",
				role: Role.PATRON,
				name: "Test Patron",
			},
			expires: "some-future-date",
		});

		const basePayload = {
			name: generateUniqueName(),
			email: generateUniqueEmail(),
			password: "password123",
		};

		const testCases = [
			{ ...basePayload, name: undefined },
			{ ...basePayload, email: undefined },
			{ ...basePayload, password: undefined },
			{ name: generateUniqueName() },
			{},
		];

		for (const payload of testCases) {
			const mockRequest = createMockRequest(payload);
			const response = await POST(mockRequest);

			expect(
				response.status,
				`Expected 400 for payload: ${JSON.stringify(payload)}`,
			).toBe(400);
			const responseBody = await response.json();
			expect(responseBody.error).toBe("Missing required fields");
		}
	});

	it("should return 400 if email already exists", async () => {
		mockedGetServerSession.mockResolvedValue({
			user: {
				id: "test-patron-id",
				email: "patron@test.com",
				role: Role.PATRON,
				name: "Test Patron",
			},
			expires: "some-future-date",
		});

		const existingEmail = generateUniqueEmail();
		const initialPayload = {
			name: generateUniqueName(),
			email: existingEmail,
			password: "passwordInitial123",
		};

		const initialMockRequest = createMockRequest(initialPayload);
		const createResponse = await POST(initialMockRequest);

		if (createResponse.status !== 200) {
			try {
				const errorBody = await createResponse.json();
				console.error(
					`[FAIL Initial Create] Status: ${createResponse.status}, Body: ${JSON.stringify(errorBody).substring(0, 500)}`,
				);
			} catch {
				console.error(
					`[FAIL Initial Create] Status: ${createResponse.status}, Failed to read body`,
				);
			}
		}
		expect(createResponse.status, "Initial user creation failed").toBe(200);
		const createBody = await createResponse.json();
		const tempUserId = createBody.user.id;
		if (tempUserId) {
			createdUserIds.push(tempUserId);
		}

		const duplicatePayload = {
			name: generateUniqueName(),
			email: existingEmail,
			password: "passwordDuplicate456",
		};

		const duplicateMockRequest = createMockRequest(duplicatePayload);
		const response = await POST(duplicateMockRequest);

		expect(response.status).toBe(400);
		const responseBody = await response.json();
		expect(responseBody.error).toBe("Email already exists");
	});

	it("should return 403 if the requesting user does not have PATRON role", async () => {
		mockedGetServerSession.mockResolvedValue({
			user: {
				id: "test-employee-id",
				email: "employee@test.com",
				role: Role.EMPLOYEE,
				name: "Test Employee",
			},
			expires: "some-future-date",
		});

		const payload = {
			name: generateUniqueName(),
			email: generateUniqueEmail(),
			password: "password123",
		};

		const mockRequest = createMockRequest(payload);
		const response = await POST(mockRequest);

		expect(response.status).toBe(403);
		const responseBody = await response.json();

		expect(responseBody.error).toBe(
			"Unauthorized - Only PATRON can create user accounts",
		);
	});

	it("should return 403 if no authentication is provided", async () => {
		mockedGetServerSession.mockResolvedValue(null);

		const payload = {
			name: generateUniqueName(),
			email: generateUniqueEmail(),
			password: "password123",
		};

		const mockRequest = createMockRequest(payload);
		const response = await POST(mockRequest);

		expect(response.status).toBe(403);
		const responseBody = await response.json();
		expect(responseBody.error).toBe(
			"Unauthorized - Only PATRON can create user accounts",
		);
	});
});
