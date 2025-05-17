import { prisma } from "@/lib/prisma";
import type { BaseWeapon } from "@prisma/client";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, OPTIONS, PUT } from "./route";

vi.mock("next/headers", () => {
	const cookiesStore = {
		get: (name: string) => {
			if (name === "auth_token") {
				return { value: "mock-token" };
			}
			return null;
		},
	};

	return {
		cookies: () => cookiesStore,
	};
});

vi.mock("@/features/auth/services/authUtils", () => {
	return {
		verifyAuthTokenAndGetUser: vi.fn((token) => {
			if (token === "mock-token") {
				const result = Object.create(null);
				Object.defineProperty(result, "user", {
					value: {
						id: 1,
						role: "DEVELOPER",
						email: "test@example.com",
						name: "Test User",
					},
					enumerable: true,
				});
				Object.defineProperty(result, "status", {
					value: 200,
					enumerable: true,
				});
				return result;
			}
			const result = Object.create(null);
			Object.defineProperty(result, "error", {
				value: "Invalid token",
				enumerable: true,
			});
			Object.defineProperty(result, "status", {
				value: 401,
				enumerable: true,
			});
			return result;
		}),
	};
});

vi.mock("next-auth/jwt", () => ({
	getToken: vi.fn().mockImplementation(() => null),
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		baseWeapon: {
			findUnique: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		weapon: {
			count: vi.fn().mockResolvedValue(0),
		},
	},
}));

type BaseWeaponData = Omit<BaseWeapon, "id">;

const createMockPutRequest = (body: BaseWeaponData): NextRequest => {
	const req = {
		json: async () => body,
		headers: new Headers({ "Content-Type": "application/json" }),
		nextUrl: new URL("http://localhost/api/base-weapons/mock"),
	} as unknown as NextRequest;
	return req;
};

const mockedFindUnique = vi.mocked(prisma.baseWeapon.findUnique);
const mockedUpdate = vi.mocked(prisma.baseWeapon.update);
const mockedDelete = vi.mocked(prisma.baseWeapon.delete);

describe("/api/base-weapons/[id] Route Handlers", () => {
	let testWeapon: BaseWeapon;
	const testId = 1;
	const testName = "Test Pistol";
	const testPrice = 100.5;
	const testCost = 50.25;

	beforeEach(() => {
		vi.resetAllMocks();

		testWeapon = {
			id: testId,
			nom: testName,
			prix_defaut: testPrice,
			cout_production_defaut: testCost,
		};

		const defaultFindUniqueImpl = async (args: {
			where: { id?: number; nom?: string };
		}) => {
			if (args?.where?.id === testId) return testWeapon;
			if (args?.where?.nom === testName) return testWeapon;
			return null;
		};

		mockedFindUnique.mockImplementation(
			defaultFindUniqueImpl as typeof mockedFindUnique,
		);

		mockedUpdate.mockResolvedValue({
			...testWeapon,
			prix_defaut: testPrice + 10,
		});
		mockedDelete.mockResolvedValue(testWeapon);
	});

	describe("GET Handler", () => {
		it("should return weapon when found by numeric ID", async () => {
			const params = Promise.resolve({ id: String(testId) });
			const response = await GET({} as NextRequest, { params });
			const body = await response.json();

			expect(mockedFindUnique).toHaveBeenCalledWith({ where: { id: testId } });
			expect(response.status).toBe(200);
			expect(body.id).toBe(testId);
			expect(body.nom).toBe(testName);
		});

		it("should return weapon when found by name", async () => {
			const params = Promise.resolve({ id: testName });
			const response = await GET({} as NextRequest, { params });
			const body = await response.json();

			expect(mockedFindUnique).toHaveBeenCalledWith({
				where: { nom: testName },
			});
			expect(response.status).toBe(200);
			expect(body.id).toBe(testId);
			expect(body.nom).toBe(testName);
		});

		it("should return 404 if not found by ID or name", async () => {
			mockedFindUnique.mockResolvedValue(null);
			const params = Promise.resolve({ id: "nonexistent" });
			const response = await GET({} as NextRequest, { params });
			const body = await response.json();

			expect(mockedFindUnique).toHaveBeenCalledWith({
				where: { nom: "nonexistent" },
			});
			expect(response.status).toBe(404);
			expect(body.error).toBe("Base weapon not found");
		});

		it("should return 500 on database error", async () => {
			mockedFindUnique.mockRejectedValue(new Error("DB connection error"));
			const params = Promise.resolve({ id: String(testId) });
			const response = await GET({} as NextRequest, { params });
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe("Failed to fetch base weapon");
		});
	});

	describe("PUT Handler", () => {
		const updateData = {
			nom: "Updated Pistol",
			prix_defaut: 120.0,
			cout_production_defaut: 60.0,
		};

		it("should update weapon when found by numeric ID", async () => {
			const mockRequest = createMockPutRequest(updateData);
			const params = Promise.resolve({ id: String(testId) });
			const response = await PUT(mockRequest, { params });
			const body = await response.json();

			expect(mockedFindUnique).toHaveBeenCalledWith({ where: { id: testId } });
			expect(mockedUpdate).toHaveBeenCalledWith({
				where: { id: testId },
				data: updateData,
			});
			expect(response.status).toBe(200);

			expect(body.prix_defaut).toBe(testPrice + 10);
		});

		it("should update weapon when found by name", async () => {
			const mockRequest = createMockPutRequest(updateData);
			const params = Promise.resolve({ id: testName });
			const response = await PUT(mockRequest, { params });
			const _body = await response.json();

			expect(mockedFindUnique).toHaveBeenCalledWith({
				where: { nom: testName },
			});
			expect(mockedUpdate).toHaveBeenCalledWith({
				where: { id: testWeapon.id },
				data: updateData,
			});
			expect(response.status).toBe(200);
		});

		it("should return 404 if not found for update", async () => {
			mockedFindUnique.mockResolvedValue(null);
			const mockRequest = createMockPutRequest(updateData);
			const params = Promise.resolve({ id: "nonexistent" });
			const response = await PUT(mockRequest, { params });
			const body = await response.json();

			expect(response.status).toBe(404);
			expect(body.error).toBe("Base weapon not found");
		});

		it("should return 500 on update error", async () => {
			mockedUpdate.mockRejectedValue(new Error("DB update error"));
			const mockRequest = createMockPutRequest(updateData);
			const params = Promise.resolve({ id: String(testId) });
			const response = await PUT(mockRequest, { params });
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe("Failed to update base weapon");
		});
	});

	describe("DELETE Handler", () => {
		it("should delete weapon when found by numeric ID", async () => {
			const params = Promise.resolve({ id: String(testId) });
			const response = await DELETE({} as NextRequest, { params });
			const body = await response.json();

			expect(mockedFindUnique).toHaveBeenCalledWith({ where: { id: testId } });
			expect(mockedDelete).toHaveBeenCalledWith({ where: { id: testId } });
			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
		});

		it("should delete weapon when found by name", async () => {
			const params = Promise.resolve({ id: testName });
			const response = await DELETE({} as NextRequest, { params });
			const body = await response.json();

			expect(mockedFindUnique).toHaveBeenCalledWith({
				where: { nom: testName },
			});
			expect(mockedDelete).toHaveBeenCalledWith({
				where: { id: testWeapon.id },
			});
			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
		});

		it("should return 404 if not found for delete", async () => {
			mockedFindUnique.mockResolvedValue(null);
			const params = Promise.resolve({ id: "nonexistent" });
			const response = await DELETE({} as NextRequest, { params });
			const body = await response.json();

			expect(response.status).toBe(404);
			expect(body.error).toBe("Base weapon not found");
		});

		it("should return 500 on delete error", async () => {
			mockedDelete.mockRejectedValue(new Error("DB delete error"));
			const params = Promise.resolve({ id: String(testId) });
			const response = await DELETE({} as NextRequest, { params });
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe("Failed to delete base weapon");
		});
	});

	describe("OPTIONS Handler", () => {
		it("should return 204 with correct CORS headers", async () => {
			const response = await OPTIONS();

			expect(response.status).toBe(204);
			expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
				"PUT",
			);
			expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
				"DELETE",
			);
			expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		});
	});
});
