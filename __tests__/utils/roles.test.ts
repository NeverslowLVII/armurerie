import {
	getCommissionRate,
	getRoleName,
	hasPermission,
	isValidRole,
	roleConfigurations, // Importer pour vérifier les valeurs
} from "@/utils/roles";
import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

describe("Roles Utils", () => {
	// Test pour isValidRole
	describe("isValidRole", () => {
		it("should return true for valid roles", () => {
			expect(isValidRole(Role.EMPLOYEE)).toBe(true);
			expect(isValidRole(Role.PATRON)).toBe(true);
			expect(isValidRole(Role.CO_PATRON)).toBe(true);
			expect(isValidRole(Role.DEVELOPER)).toBe(true);
		});

		it("should return false for invalid inputs", () => {
			expect(isValidRole("INVALID_ROLE")).toBe(false);
			expect(isValidRole("")).toBe(false);
			expect(isValidRole(null as unknown as string)).toBe(false);
			expect(isValidRole(undefined as unknown as string)).toBe(false);
		});
	});

	// Test pour getCommissionRate
	describe("getCommissionRate", () => {
		it("should return the correct commission rate for each role", () => {
			expect(getCommissionRate(Role.EMPLOYEE)).toBe(
				roleConfigurations.EMPLOYEE.commissionRate,
			);
			expect(getCommissionRate(Role.CO_PATRON)).toBe(
				roleConfigurations.CO_PATRON.commissionRate,
			);
			expect(getCommissionRate(Role.PATRON)).toBe(
				roleConfigurations.PATRON.commissionRate,
			);
			// Développeur a un taux de 0
			expect(getCommissionRate(Role.DEVELOPER)).toBe(0);
		});
	});

	// Test pour hasPermission
	describe("hasPermission", () => {
		it("should return true if the role has the specific permission", () => {
			expect(hasPermission(Role.PATRON, "canManageUsers")).toBe(true);
			expect(hasPermission(Role.EMPLOYEE, "canManageWeapons")).toBe(false);
			expect(hasPermission(Role.CO_PATRON, "canViewStatistics")).toBe(true);
		});

		it("should return true for DEVELOPER for any permission (System Admin)", () => {
			expect(hasPermission(Role.DEVELOPER, "canManageUsers")).toBe(true);
			expect(hasPermission(Role.DEVELOPER, "canManageWeapons")).toBe(true);
			expect(hasPermission(Role.DEVELOPER, "canViewStatistics")).toBe(true);
			expect(hasPermission(Role.DEVELOPER, "canManageFeedback")).toBe(true);
			expect(hasPermission(Role.DEVELOPER, "canAccessAdminPanel")).toBe(true);
			expect(hasPermission(Role.DEVELOPER, "canManageBaseWeapons")).toBe(true);
		});

		it("should return false for permissions not explicitly granted (and not System Admin)", () => {
			expect(hasPermission(Role.EMPLOYEE, "canManageUsers")).toBe(false);
			expect(hasPermission(Role.CO_PATRON, "canManageFeedback")).toBe(false);
		});

		it("should handle the isSystemAdmin permission check directly", () => {
			expect(hasPermission(Role.DEVELOPER, "isSystemAdmin")).toBe(true);
			expect(hasPermission(Role.PATRON, "isSystemAdmin")).toBe(false);
			expect(hasPermission(Role.EMPLOYEE, "isSystemAdmin")).toBe(false);
		});
	});

	// Test pour getRoleName
	describe("getRoleName", () => {
		it("should return the correct French name for each role", () => {
			expect(getRoleName(Role.EMPLOYEE)).toBe("Employé");
			expect(getRoleName(Role.CO_PATRON)).toBe("Co-Patron");
			expect(getRoleName(Role.PATRON)).toBe("Patron");
			expect(getRoleName(Role.DEVELOPER)).toBe("Développeur");
		});

		it("should return the role string if no specific name is defined (future proofing)", () => {
			const unknownRole = "FUTURE_ROLE" as Role;
			expect(getRoleName(unknownRole)).toBe("FUTURE_ROLE");
		});
	});
});
