import { nanoid } from 'nanoid';

interface Subscription {
	planName: string;
	price: number;
	billingCycleDays: number;
}

interface Invoice {
	id: string;
	customerId: string;
	amount: number;
	status: string;
	date: string;
}

/**
 * In-memory storage for invoices. 
 * This is a simple array that holds the generated invoices.
 * Note: This is a temporary storage solution; consider using a persistent storage solution for production.
 */
export const invoices: Invoice[] = [];

export interface Env {
	SUBSCRIPTIONS_KV: KVNamespace;
}

/**
 * Cloudflare Worker script that handles incoming HTTP requests.
 * 
 * @param {Request} request - The incoming HTTP request.
 * @param {Env} env - The environment bindings, including access to KV namespaces.
 * @returns {Promise<Response>} - The HTTP response.
 */
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
			const url = new URL(request.url);

			// Handle POST request to generate an invoice
			if (request.method === 'POST' && url.pathname === '/invoice/generate') {
				const body = await request.json() as { customerId: string };

				// Validate that the customerId is provided in the request body
				if (!body.customerId) {
					return new Response(JSON.stringify({ error: 'customerId is required' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					});
				}

				const customerId = body.customerId;

				// Fetch the subscription plan for the customer from KV storage
				const subscription = await getSubscriptionByCustomerId(env, customerId);

				// If no subscription is found, return a 404 error
				if (!subscription) {
					return new Response(JSON.stringify({ error: 'Subscription not found' }), {
						status: 404,
						headers: { 'Content-Type': 'application/json' },
					});
				}

				// Calculate the invoice amount based on the subscription plan
				const amountDue = calculateInvoiceAmount(subscription);

				// Create a new invoice object
				const invoice: Invoice = {
					id: nanoid(), // Generate a unique ID for the invoice
					customerId,
					amount: amountDue,
					status: 'generated',
					date: new Date().toISOString(),
				};

				// Store the generated invoice in-memory
				invoices.push(invoice);

				// Return the generated invoice as the response
				return new Response(
					JSON.stringify({ message: 'Invoice generated successfully', invoice }),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					}
				);
			}

			// Handle non-existing routes with a 404 response
			return new Response('Not Found', {
				status: 404,
				headers: { 'Content-Type': 'text/plain' },
			});
		} catch (error) {
			// Catch and handle any unexpected errors with a 500 response
			const err = error as Error;
			return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
};

/**
 * Retrieves the subscription plan for a customer from the KV namespace.
 * 
 * @param {Env} env - The environment bindings, including access to KV namespaces.
 * @param {string} customerId - The unique identifier of the customer.
 * @returns {Promise<Subscription | null>} - The subscription object if found, otherwise null.
 */
async function getSubscriptionByCustomerId(env: Env, customerId: string): Promise<Subscription | null> {
	// Retrieve the subscription data from KV storage using the customerId as the key
	const subscriptionData = await env.SUBSCRIPTIONS_KV.get(customerId, { type: 'json' });

	if (!subscriptionData) {
		return null; // Return null if the subscription doesn't exist
	}

	return subscriptionData as Subscription; // Typecast the retrieved data to Subscription type
}

/**
 * Calculates the invoice amount based on the subscription plan.
 * 
 * @param {Subscription} subscription - The subscription plan object.
 * @returns {number} - The amount to be billed for the subscription.
 */
function calculateInvoiceAmount(subscription: Subscription): number {
	return subscription.price; // Simply returns the price of the subscription plan as the invoice amount
}
