import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

global.fetch = vi.fn();

type WebhookRequestBody = {
	orderData?: {
		items?: Array<{ quantity: number; name: string }>;
		total?: number;
		profit?: number;
	};
	username?: string;
};

const createMockRequest = (body: WebhookRequestBody): Request => {
	const req = {
		json: async () => body,
		headers: new Headers({ "Content-Type": "application/json" }),
	} as unknown as Request;
	return req;
};

const originalEnv = { ...process.env };

describe("/api/discord/webhook Route Handler", () => {
	beforeEach(() => {
		vi.resetAllMocks();

		process.env = { ...originalEnv };
		process.env.DISCORD_WEBHOOK_URL =
			"https://discord.com/api/webhooks/123/abc";

		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	describe("POST Handler", () => {
		const validOrderData = {
			items: [
				{ quantity: 2, name: "Test Item A" },
				{ quantity: 1, name: "Test Item B" },
			],
			total: 150.75,
			profit: 50.25,
		};
		const validUsername = "TestUser123";
		const validRequestBody = {
			orderData: validOrderData,
			username: validUsername,
		};

		it("should send a webhook successfully with valid data", async () => {
			const mockRequest = createMockRequest(validRequestBody);
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(fetch).toHaveBeenCalledTimes(1);
			expect(fetch).toHaveBeenCalledWith(
				process.env.DISCORD_WEBHOOK_URL,
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: expect.any(String),
				}),
			);

			const fetchCallArgs = vi.mocked(fetch).mock.calls[0];
			const webhookPayload = JSON.parse(fetchCallArgs[1]?.body as string);
			expect(webhookPayload.embeds[0].title).toBe("Nouvelle commande validée");
			expect(webhookPayload.embeds[0].description).toContain(validUsername);
			expect(webhookPayload.embeds[0].fields[0].value).toContain(
				"2x Test Item A",
			);
			expect(webhookPayload.embeds[0].fields[0].value).toContain(
				"1x Test Item B",
			);
			expect(webhookPayload.embeds[0].fields[1].value).toContain(
				String(validOrderData.total),
			);
			expect(webhookPayload.embeds[0].fields[2].value).toContain(
				String(validOrderData.profit),
			);

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
		});

		it("should return 500 if DISCORD_WEBHOOK_URL is not configured", async () => {
			process.env.DISCORD_WEBHOOK_URL = undefined;

			const mockRequest = createMockRequest(validRequestBody);
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(fetch).not.toHaveBeenCalled();
			expect(response.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.error).toBe("Webhook URL not configured");
		});

		it("should return 400 if username is missing", async () => {
			const invalidBody = { orderData: validOrderData };
			const mockRequest = createMockRequest(invalidBody);
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(fetch).not.toHaveBeenCalled();
			expect(response.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.error).toBe("Missing required data");
		});

		it("should return 400 if orderData is missing", async () => {
			const invalidBody = { username: validUsername };
			const mockRequest = createMockRequest(invalidBody);
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(fetch).not.toHaveBeenCalled();
			expect(response.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.error).toBe("Missing required data");
		});

		it("should handle missing items in orderData gracefully", async () => {
			const bodyWithoutItems = {
				orderData: { total: 100, profit: 20 },
				username: validUsername,
			};
			const mockRequest = createMockRequest(bodyWithoutItems);
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(fetch).toHaveBeenCalledTimes(1);
			const fetchCallArgs = vi.mocked(fetch).mock.calls[0];
			const webhookPayload = JSON.parse(fetchCallArgs[1]?.body as string);
			expect(webhookPayload.embeds[0].fields[0].value).toBe(
				"Aucun détail disponible",
			);

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
		});

		it("should handle missing total/profit in orderData gracefully", async () => {
			const bodyWithoutTotals = {
				orderData: { items: [] },
				username: validUsername,
			};
			const mockRequest = createMockRequest(bodyWithoutTotals);
			await POST(mockRequest);

			expect(fetch).toHaveBeenCalledTimes(1);
			const fetchCallArgs = vi.mocked(fetch).mock.calls[0];
			const webhookPayload = JSON.parse(fetchCallArgs[1]?.body as string);
			expect(webhookPayload.embeds[0].fields[1].value).toBe("0$");
			expect(webhookPayload.embeds[0].fields[2].value).toBe("0$");
		});

		it("should return 500 if fetch to Discord fails", async () => {
			const fetchErrorText = "Discord API error: Invalid webhook token";
			vi.mocked(fetch).mockResolvedValue(
				new Response(fetchErrorText, { status: 401 }),
			);

			const mockRequest = createMockRequest(validRequestBody);
			const response = await POST(mockRequest);
			const body = await response.json();

			expect(fetch).toHaveBeenCalledTimes(1);
			expect(response.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.error).toBe(fetchErrorText);
		});

		it("should return 500 on generic exception", async () => {
			const mockRequest = {
				json: async () => {
					throw new Error("Parsing failed");
				},
				headers: new Headers({ "Content-Type": "application/json" }),
			} as unknown as Request;

			const response = await POST(mockRequest);
			const body = await response.json();

			expect(fetch).not.toHaveBeenCalled();
			expect(response.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.error).toContain("Parsing failed");
		});
	});
});
