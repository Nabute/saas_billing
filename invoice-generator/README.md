# Invoice Generation Function

This package contains a Cloudflare Worker that generates invoices based on a customer's subscription plan. The function is implemented in TypeScript and can be triggered via an HTTP POST request.

## Features

- **Invoice Generation**: Calculates the invoice amount based on the customer's subscription plan.
- **HTTP Trigger**: The function is triggered by a POST request to the `/invoice/generate` endpoint.
- **In-Memory Storage**: Stores generated invoices in a simple in-memory array.

## Prerequisites

- **Node.js** and **npm** installed on your local machine.
- **Wrangler** CLI installed. You can install it globally using the following command:

  ```bash
  npm install -g wrangler
  ```
- A Cloudflare account with access to Workers.


## Setup

1. **CD to the project  directory:**

    ```bash
    cd invoice-generator
    ```
2. **Install dependencies:**

    ```bash
    npm install
    ```
3. **Configure Wrangler**

    Update the wrangler.toml file with your Cloudflare account details:

    ```toml
    name = "invoice-generator"

    type = "javascript"

    account_id = "<cloudflare-account-id>"

    workers_dev = true

    compatibility_date = "2024-08-23"

    [env.production]
    zone_id = "<zone-id>"

    route = "https://example.com/invoice/generate"

    [build]
    command = "npm run build"

    [build.upload]
    format = "service-worker"


    [[kv_namespaces]]
    binding = "SUBSCRIPTIONS_KV" # KV namespace binding
    id = "kv-namespace-id"  # KV namespace ID
    ```

4. **Build the project:**

    ```bash
    npm run build
    ```

5. **Deploy to Cloudflare:**

    ```bash
    wrangler publish
    ```

6. **Test Locally:**

    ```bash
    wrangler dev
    ```

The function will be available at http://127.0.0.1:8787/invoice/generate.

## Usage

### HTTP Endpoint

The worker exposes an HTTP POST endpoint at `/invoice/generate`. You can trigger invoice generation by sending a POST request with the following payload:

```json
{
  "customerId": "12345"
}
```

### Example cURL Request

```bash
curl -X POST https://<your-cloudflare-worker-url>/invoice/generate \
-H "Content-Type: application/json" \
-d '{
  "customerId": "12345"
}'
```

### Response

The worker will return a JSON response containing the generated invoice:

```json
{
  "message": "Invoice generated successfully",
  "invoice": {
    "id": "abc123xyz",
    "customerId": "12345",
    "amount": 29.99,
    "status": "generated",
    "date": "2024-08-23T12:34:56.789Z"
  }
}
```

## Development

**Adding More Features**

To extend the functionality, you can:

* Integrate with a real database for storing invoices.
* Add authentication to secure the endpoint.
* Implement more sophisticated invoice calculation logic.

**Deployment to Production**

When you're ready to deploy to production, use the following command:

```bash
wrangler publish --env production
```

This will deploy the worker according to the production configuration specified in the `wrangler.toml` file.