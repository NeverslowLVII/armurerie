import { prisma } from "@/lib/prisma";
import type { BaseWeapon } from "@prisma/client";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { cookies } from "next/headers";
import { type User } from "@prisma/client";

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
			findMany: vi.fn(),
			create: vi.fn(),
			count: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

type BaseWeaponData = Omit<BaseWeapon, "id">;

const createMockPostRequest = (body: BaseWeaponData): Request => {
	const req = {
		json: async () => body,
		headers: new Headers({ "Content-Type": "application/json" }),
	} as unknown as Request;
	return req;
};

const createMockGetRequest = (
	searchParams: URLSearchParams = new URLSearchParams(),
): NextRequest => {
	const req = {
		nextUrl: {
			searchParams,
		},
		headers: new Headers(),
	} as unknown as NextRequest;
	return req;
};

const mockedFindMany = vi.mocked(prisma.baseWeapon.findMany);
const mockedCreate = vi.mocked(prisma.baseWeapon.create);
const mockedCount = vi.mocked(prisma.baseWeapon.count);
const mockedTransaction = vi.mocked(prisma.$transaction);

describe("/api/base-weapons Route Handlers", () => {
	let testWeapons: BaseWeapon[];
	let newWeaponData: Omit<BaseWeapon, "id">;
	let createdWeapon: BaseWeapon;

	beforeEach(() => {
		vi.resetAllMocks();

		testWeapons = [
			{
				id: 1,
				nom: "Test Pistol",
				prix_defaut: 100.5,
				cout_production_defaut: 50.25,
			},
			{
				id: 2,
				nom: "Test Rifle",
				prix_defaut: 300.0,
				cout_production_defaut: 150.0,
			},
		];

		newWeaponData = {
			nom: "New SMG",
			prix_defaut: 180.0,
			cout_production_defaut: 90.0,
		};

		createdWeapon = {
			id: 3,
			...newWeaponData,
		};

		mockedCreate.mockResolvedValue(createdWeapon);
		mockedFindMany.mockResolvedValue(testWeapons);
		mockedCount.mockResolvedValue(testWeapons.length);

		mockedTransaction.mockImplementation(async () => {
			const findManyResult = await mockedFindMany();
			const countResult = await mockedCount();
			return [findManyResult, countResult] as [BaseWeapon[], number];
		});
	});

	describe("GET Handler", () => {
		it("should return all base weapons", async () => {
			const mockRequest = createMockGetRequest();
			const response = await GET(mockRequest);
			const body = await response.json();

			expect(mockedTransaction).toHaveBeenCalledTimes(1);
			expect(response.status).toBe(200);
			expect(body.baseWeapons).toEqual(testWeapons);
			expect(body.totalCount).toBe(testWeapons.length);
			expect(body.baseWeapons.length).toBe(2);
		});

		it("should return 500 on database error", async () => {
			mockedTransaction.mockRejectedValue(new Error("DB transaction error"));
			const mockRequest = createMockGetRequest();
			const response = await GET(mockRequest);
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.error).toBe("Error fetching base weapons");
		});
	});

	describe("POST Handler", () => {
		it("should create a new base weapon", async () => {
			const mockRequest = createMockPostRequest(newWeaponData);
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(mockedCreate).toHaveBeenCalledTimes(1);
			expect(mockedCreate).toHaveBeenCalledWith({ data: newWeaponData });
			expect(response.status).toBe(200);
			expect(body).toEqual(createdWeapon);
			expect(body.id).toBe(3);
			expect(body.nom).toBe(newWeaponData.nom);
		});

		it("should create a new base weapon with default cost if not provided", async () => {
			const dataWithoutCost = {
				nom: "New Knife",
				prix_defaut: 50.0,
			};
			const expectedCreateData = {
				...dataWithoutCost,
				cout_production_defaut: 0,
			};
			const mockCreatedWeaponWithDefaultCost = {
				id: 4,
				...expectedCreateData,
			};
			mockedCreate.mockResolvedValue(mockCreatedWeaponWithDefaultCost);

			const mockRequest = createMockPostRequest(
				dataWithoutCost as BaseWeaponData,
			);
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(mockedCreate).toHaveBeenCalledTimes(1);
			expect(mockedCreate).toHaveBeenCalledWith({ data: expectedCreateData });
			expect(response.status).toBe(200);
			expect(body).toEqual(mockCreatedWeaponWithDefaultCost);
			expect(body.cout_production_defaut).toBe(0);
		});

		it("should return 500 on database error during creation", async () => {
			mockedCreate.mockRejectedValue(new Error("DB create error"));
			const mockRequest = createMockPostRequest(newWeaponData);
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(mockedCreate).toHaveBeenCalledTimes(1);
			expect(response.status).toBe(500);
			expect(body.error).toBe("Error creating base weapon");
		});

		it("should return 500 if request body is malformed/missing", async () => {
			const mockRequest = {
				json: async () => {
					throw new Error("Invalid JSON");
				},
				headers: new Headers({ "Content-Type": "application/json" }),
			} as unknown as Request;

			const response = await POST(mockRequest);
			const body = await response.json();

			expect(mockedCreate).not.toHaveBeenCalled();
			expect(response.status).toBe(500);
			expect(body.error).toBe("Error creating base weapon");
		});
	});
});
