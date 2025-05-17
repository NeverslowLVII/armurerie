import { formatCurrency, formatDate, formatPercentage } from "@/utils/format";
import { describe, expect, it } from "vitest";

describe("Formatting Utils", () => {
	// Test pour formatCurrency
	describe("formatCurrency", () => {
		it("should format positive cents into USD correctly (based on system locale)", () => {
			// eslint-disable-next-line no-magic-numbers
			expect(formatCurrency(12_345)).toBe("123,45\u00A0USD");
			// eslint-disable-next-line no-magic-numbers
			expect(formatCurrency(100)).toBe("1,00\u00A0USD");
			// eslint-disable-next-line no-magic-numbers
			expect(formatCurrency(50)).toBe("0,50\u00A0USD");
		});

		it("should format zero cents correctly (based on system locale)", () => {
			expect(formatCurrency(0)).toBe("0,00\u00A0USD");
		});

		it("should format negative cents correctly (based on system locale)", () => {
			// eslint-disable-next-line no-magic-numbers
			expect(formatCurrency(-5000)).toBe("-50,00\u00A0USD");
		});

		it("should handle large numbers correctly (based on system locale)", () => {
			// eslint-disable-next-line no-magic-numbers
			expect(formatCurrency(123_456_789)).toBe(
				"1\u202F234\u202F567,89\u00A0USD",
			);
		});
	});

	// Test pour formatDate
	describe("formatDate", () => {
		it("should format Date objects into DD/MM/YYYY string (based on system locale)", () => {
			// Using specific dates is necessary for testing
			// eslint-disable-next-line no-magic-numbers
			const date1 = new Date(2023, 10, 25); // November 25, 2023
			expect(formatDate(date1)).toBe("25/11/2023"); // Attend le format français

			// eslint-disable-next-line no-magic-numbers
			const date2 = new Date(2024, 0, 1); // January 1, 2024
			expect(formatDate(date2)).toBe("01/01/2024"); // Attend le format français
		});

		// Note: Testing for specific timezones can be complex and might require mocking Date
	});

	// Test pour formatPercentage
	describe("formatPercentage", () => {
		it("should format decimal numbers into percentages (based on system locale)", () => {
			// eslint-disable-next-line no-magic-numbers
			expect(formatPercentage(0.75)).toBe("75,0\u00A0%"); // Attend le format français
			// eslint-disable-next-line no-magic-numbers
			expect(formatPercentage(0.123)).toBe("12,3\u00A0%");
			// eslint-disable-next-line no-magic-numbers
			expect(formatPercentage(1.5)).toBe("150,0\u00A0%");
		});

		it("should format zero correctly (based on system locale)", () => {
			expect(formatPercentage(0)).toBe("0,0\u00A0%");
		});

		it("should format negative decimals correctly (based on system locale)", () => {
			// eslint-disable-next-line no-magic-numbers
			expect(formatPercentage(-0.25)).toBe("-25,0\u00A0%");
		});

		it("should handle rounding correctly to one decimal place (based on system locale)", () => {
			// eslint-disable-next-line no-magic-numbers
			expect(formatPercentage(0.123_45)).toBe("12,3\u00A0%");
			// eslint-disable-next-line no-magic-numbers
			expect(formatPercentage(0.9876)).toBe("98,8\u00A0%");
		});
	});
});
