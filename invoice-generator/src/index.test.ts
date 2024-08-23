import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler, { Env, invoices } from './index';

// Mock the nanoid function to return a consistent ID for testing
vi.mock('nanoid', () => {
	return { nanoid: () => 'test-id' };
});

// Mock the Env interface
const env: Env = {
	SUBSCRIPTIONS_KV: {
		get: vi.fn(),
	} as any, // Cast to any because we're only mocking specific methods
};

describe('Invoice Generation Worker', () => {
	beforeEach(() => {
		// Clear the invoices array before each test
		invoices.length = 0;
	});

	it('should generate an invoice successfully', async () => {
		const customerId = '12345';
		const subscription = {
			planName: 'Pro Plan',
			price: 29.99,
			billingCycleDays: 30,
		};

		// Mock the KV get method to return a subscription
		env.SUBSCRIPTIONS_KV.get = vi.fn().mockResolvedValue(subscription);

		const request = new Request('https://example.com/invoice/generate', {
			method: 'POST',
			body: JSON.stringify({ customerId }),
		});

		const response = await handler.fetch(request, env);
		const responseBody = await response.json() as { message: string, invoice: any };

		expect(response.status).toBe(200);
		expect(responseBody.message).toBe('Invoice generated successfully');
		expect(responseBody.invoice).toEqual({
			id: 'test-id',
			customerId,
			amount: subscription.price,
			status: 'generated',
			date: expect.any(String),
		});

		// Verify that the invoice was stored in-memory
		expect(invoices).toHaveLength(1);
		expect(invoices[0]).toEqual({
			id: 'test-id',
			customerId,
			amount: subscription.price,
			status: 'generated',
			date: expect.any(String),
		});
	});

	it('should return 400 if customerId is missing', async () => {
		const request = new Request('https://example.com/invoice/generate', {
			method: 'POST',
			body: JSON.stringify({}),
		});

		const response = await handler.fetch(request, env);
		const responseBody = await response.json() as { error: string };

		expect(response.status).toBe(400);
		expect(responseBody.error).toBe('customerId is required');
	});

	it('should return 404 if subscription is not found', async () => {
		const customerId = '12345';

		// Mock the KV get method to return null
		env.SUBSCRIPTIONS_KV.get = vi.fn().mockResolvedValue(null);

		const request = new Request('https://example.com/invoice/generate', {
			method: 'POST',
			body: JSON.stringify({ customerId }),
		});

		const response = await handler.fetch(request, env);
		const responseBody = await response.json() as { error: string };

		expect(response.status).toBe(404);
		expect(responseBody.error).toBe('Subscription not found');
	});

	it('should return 404 for non-existing routes', async () => {
		const request = new Request('https://example.com/non-existing-route', {
			method: 'GET',
		});

		const response = await handler.fetch(request, env);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe('Not Found');
	});

	it('should handle unexpected errors gracefully', async () => {
		const customerId = '12345';

		// Mock the KV get method to throw an error
		env.SUBSCRIPTIONS_KV.get = vi.fn().mockRejectedValue(new Error('Unexpected error'));

		const request = new Request('https://example.com/invoice/generate', {
			method: 'POST',
			body: JSON.stringify({ customerId }),
		});

		const response = await handler.fetch(request, env);
		const responseBody = await response.json() as { error: string, details: string };

		expect(response.status).toBe(500);
		expect(responseBody.error).toBe('Internal Server Error');
		expect(responseBody.details).toBe('Unexpected error');
	});
});
