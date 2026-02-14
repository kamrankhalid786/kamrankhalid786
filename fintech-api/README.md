# Fintech API Demo (Student Project)

This project is a small teaching API that demonstrates the difference between:

- a normal CRUD API
- a fintech-style API that also handles compliance, transaction safety, and auditability

It uses **Node.js built-in modules only** (no runtime dependencies), so students can focus on architecture and behavior.

## What this demo shows

- `Authorization: Bearer <token>` on private routes
- `Idempotency-Key` support on `POST /v1/payments`
- Basic KYC and AML gates before funds movement
- Basic fraud heuristics (velocity and repeated-pattern checks)
- Double-entry ledger posting for successful payments
- Tamper-evident audit log chain (`prevHash` + `hash`)
- Sensitive data redaction (`maskedAccountNumber`)

## Quick start

```bash
node -v
npm test
npm start
```

Optional env vars:

```bash
export PORT=3000
export DEMO_API_TOKEN=demo-fintech-token
```

Default token if not set: `demo-fintech-token`.

## Postman collection

- Collection file: `postman/fintech-api-demo.postman_collection.json`
- In Postman: Import -> File -> select the collection JSON
- Ensure variables:
  - `baseUrl`: `http://localhost:3000`
  - `apiToken`: `demo-fintech-token` (or your `DEMO_API_TOKEN` value)

Suggested execution order in Postman:

1. `GET /health (public)`
2. `GET /v1/accounts`
3. `POST /v1/payments (create idempotent payment)`
4. `POST /v1/payments (replay same request)`
5. `GET /v1/ledger`
6. `GET /v1/audit-logs/verify`

## API endpoints

Public:

- `GET /health`

Private (`Authorization: Bearer <token>`):

- `GET /v1/customers`
- `POST /v1/customers`
- `GET /v1/accounts`
- `POST /v1/accounts`
- `GET /v1/accounts/:id/balance`
- `POST /v1/payments`
- `GET /v1/payments/:id`
- `GET /v1/ledger`
- `GET /v1/audit-logs`
- `GET /v1/audit-logs/verify`

## Demo flow for class

1. Check health (no auth):

```bash
curl -s http://localhost:3000/health | jq
```

2. List seeded accounts (auth required):

```bash
curl -s http://localhost:3000/v1/accounts \
  -H "Authorization: Bearer demo-fintech-token" | jq
```

3. Create a payment with idempotency key:

```bash
curl -s http://localhost:3000/v1/payments \
  -X POST \
  -H "Authorization: Bearer demo-fintech-token" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: class-demo-001" \
  -d '{
    "sourceAccountId":"acc_demo_alice_usd",
    "destinationAccountId":"acc_demo_bob_usd",
    "amountCents":12000,
    "currency":"USD",
    "note":"Invoice #1001"
  }' | jq
```

4. Repeat the exact same request with same key. Response is replayed and balances are not charged again.

5. Inspect ledger and audit logs:

```bash
curl -s http://localhost:3000/v1/ledger \
  -H "Authorization: Bearer demo-fintech-token" | jq

curl -s http://localhost:3000/v1/audit-logs \
  -H "Authorization: Bearer demo-fintech-token" | jq

curl -s http://localhost:3000/v1/audit-logs/verify \
  -H "Authorization: Bearer demo-fintech-token" | jq
```

## Suggested teaching discussion

- Why fintech APIs require idempotency for money movement
- Why a payment API is more than "insert row in payments table"
- Why audit trails need tamper detection
- Why compliance/fraud checks sit inline with transaction orchestration
- Which parts in this demo are simplified versus production systems

## Production gaps (intentional)

This is a teaching demo. Production fintech systems would add:

- Strong authN/authZ (OAuth2/JWT scopes/mTLS)
- HSM-backed key management and secret rotation
- Real KYC/AML provider integrations
- Durable databases and transactional guarantees
- Exactly-once eventing and reconciliation jobs
- Advanced fraud models and alerting
- Regulatory reporting pipelines
