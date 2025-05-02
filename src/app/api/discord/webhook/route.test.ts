import { NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// Mock global fetch
global.fetch = vi.fn();

// Helper function to create a mock Request
const createMockRequest = (body: any): Request => {
  const req = {
    json: async () => body,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as Request;
  return req;
};

// Store original environment variable
const originalWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
const testWebhookUrl = 'https://discord.com/api/webhooks/123/abc';

describe('/api/discord/webhook Route Handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set a default valid webhook URL for most tests
    process.env.DISCORD_WEBHOOK_URL = testWebhookUrl;
    // Default fetch mock implementation (successful)
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
  });

  afterEach(() => {
    // Restore original environment variable after each test
    process.env.DISCORD_WEBHOOK_URL = originalWebhookUrl;
  });

  // --- POST Handler Tests ---
  describe('POST Handler', () => {
    const validOrderData = {
      items: [
        { quantity: 2, name: 'Test Item A' },
        { quantity: 1, name: 'Test Item B' },
      ],
      total: 150.75,
      profit: 50.25,
    };
    const validUsername = 'TestUser123';
    const validRequestBody = {
      orderData: validOrderData,
      username: validUsername,
    };

    it('should send a webhook successfully with valid data', async () => {
      const mockRequest = createMockRequest(validRequestBody);
      const response = await POST(mockRequest);
      const body = await response.json();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        testWebhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String), // Check body structure separately if needed
        })
      );

      // Optionally: Parse the body sent to fetch and check embed details
      const fetchCallArgs = vi.mocked(fetch).mock.calls[0];
      const webhookPayload = JSON.parse(fetchCallArgs[1]?.body as string);
      expect(webhookPayload.embeds[0].title).toBe('Nouvelle commande validée');
      expect(webhookPayload.embeds[0].description).toContain(validUsername);
      expect(webhookPayload.embeds[0].fields[0].value).toContain(
        '2x Test Item A'
      );
      expect(webhookPayload.embeds[0].fields[0].value).toContain(
        '1x Test Item B'
      );
      expect(webhookPayload.embeds[0].fields[1].value).toContain(
        String(validOrderData.total)
      );
      expect(webhookPayload.embeds[0].fields[2].value).toContain(
        String(validOrderData.profit)
      );

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should return 500 if DISCORD_WEBHOOK_URL is not configured', async () => {
      delete process.env.DISCORD_WEBHOOK_URL; // Unset the env var for this test

      const mockRequest = createMockRequest(validRequestBody);
      const response = await POST(mockRequest);
      const body = await response.json();

      expect(fetch).not.toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Webhook URL not configured');
    });

    it('should return 400 if username is missing', async () => {
      const invalidBody = { orderData: validOrderData /* username missing */ };
      const mockRequest = createMockRequest(invalidBody);
      const response = await POST(mockRequest);
      const body = await response.json();

      expect(fetch).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Missing required data');
    });

    it('should return 400 if orderData is missing', async () => {
      const invalidBody = { username: validUsername /* orderData missing */ };
      const mockRequest = createMockRequest(invalidBody);
      const response = await POST(mockRequest);
      const body = await response.json();

      expect(fetch).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Missing required data');
    });

    it('should handle missing items in orderData gracefully', async () => {
      const bodyWithoutItems = {
        orderData: { total: 100, profit: 20 /* items missing */ },
        username: validUsername,
      };
      const mockRequest = createMockRequest(bodyWithoutItems);
      const response = await POST(mockRequest);
      const body = await response.json();

      expect(fetch).toHaveBeenCalledTimes(1);
      const fetchCallArgs = vi.mocked(fetch).mock.calls[0];
      const webhookPayload = JSON.parse(fetchCallArgs[1]?.body as string);
      expect(webhookPayload.embeds[0].fields[0].value).toBe(
        'Aucun détail disponible'
      ); // Check default message

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should handle missing total/profit in orderData gracefully', async () => {
      const bodyWithoutTotals = {
        orderData: { items: [] /* total/profit missing */ },
        username: validUsername,
      };
      const mockRequest = createMockRequest(bodyWithoutTotals);
      await POST(mockRequest);

      expect(fetch).toHaveBeenCalledTimes(1);
      const fetchCallArgs = vi.mocked(fetch).mock.calls[0];
      const webhookPayload = JSON.parse(fetchCallArgs[1]?.body as string);
      expect(webhookPayload.embeds[0].fields[1].value).toBe('0$'); // Check default total
      expect(webhookPayload.embeds[0].fields[2].value).toBe('0$'); // Check default profit
    });

    it('should return 500 if fetch to Discord fails', async () => {
      const fetchErrorText = 'Discord API error: Invalid webhook token';
      vi.mocked(fetch).mockResolvedValue(
        new Response(fetchErrorText, { status: 401 })
      ); // Simulate Discord error

      const mockRequest = createMockRequest(validRequestBody);
      const response = await POST(mockRequest);
      const body = await response.json();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe(fetchErrorText);
    });

    it('should return 500 on generic exception', async () => {
      // Simulate error during request.json()
      const mockRequest = {
        json: async () => {
          throw new Error('Parsing failed');
        },
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as unknown as Request;

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(fetch).not.toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Parsing failed');
    });
  });
});
