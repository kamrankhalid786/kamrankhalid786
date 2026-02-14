import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import { handleRequest } from "../src/app.js";
import { resetStore } from "../src/core/store.js";

const token = process.env.DEMO_API_TOKEN ?? "demo-fintech-token";

function createMockResponse() {
  const chunks = [];
  const headers = {};
  let resolveEnd;

  const done = new Promise((resolve) => {
    resolveEnd = resolve;
  });

  return {
    statusCode: 200,
    setHeader(name, value) {
      headers[name.toLowerCase()] = String(value);
    },
    getHeader(name) {
      return headers[name.toLowerCase()];
    },
    end(chunk = "") {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      resolveEnd();
    },
    async result() {
      await done;
      const rawBody = Buffer.concat(chunks).toString("utf8");
      return {
        statusCode: this.statusCode,
        headers,
        body: rawBody ? JSON.parse(rawBody) : null
      };
    }
  };
}

async function invokeApi(method, path, { body, auth = true, headers = {} } = {}) {
  const requestHeaders = {
    host: "localhost",
    ...(auth ? { authorization: `Bearer ${token}` } : {}),
    ...headers
  };

  let chunks = [];
  if (body !== undefined) {
    requestHeaders["content-type"] = "application/json";
    chunks = [Buffer.from(JSON.stringify(body))];
  }

  const req = Readable.from(chunks);
  req.method = method;
  req.url = path;
  req.headers = requestHeaders;

  const res = createMockResponse();
  await handleRequest(req, res);
  return res.result();
}

test.beforeEach(() => {
  resetStore();
});

test("GET /health is public", async () => {
  const response = await invokeApi("GET", "/health", { auth: false });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "ok");
});

test("auth is required for private endpoints", async () => {
  const response = await invokeApi("GET", "/v1/accounts", { auth: false });
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error.code, "AUTH_REQUIRED");
});

test("idempotent payment does not charge twice", async () => {
  const paymentPayload = {
    sourceAccountId: "acc_demo_alice_usd",
    destinationAccountId: "acc_demo_bob_usd",
    amountCents: 12000,
    currency: "USD",
    note: "Invoice #1001"
  };

  const before = await invokeApi("GET", "/v1/accounts/acc_demo_alice_usd/balance");
  const beforeBalance = before.body.account.availableBalanceCents;

  const first = await invokeApi("POST", "/v1/payments", {
    body: paymentPayload,
    headers: { "idempotency-key": "demo-key-1" }
  });

  assert.equal(first.statusCode, 201);
  assert.equal(first.body.payment.status, "posted");
  assert.equal(first.headers["idempotency-replayed"], "false");

  const afterFirst = await invokeApi("GET", "/v1/accounts/acc_demo_alice_usd/balance");
  const afterFirstBalance = afterFirst.body.account.availableBalanceCents;
  assert.equal(afterFirstBalance, beforeBalance - paymentPayload.amountCents);

  const second = await invokeApi("POST", "/v1/payments", {
    body: paymentPayload,
    headers: { "idempotency-key": "demo-key-1" }
  });

  assert.equal(second.statusCode, 201);
  assert.equal(second.headers["idempotency-replayed"], "true");
  assert.equal(second.body.payment.id, first.body.payment.id);

  const afterSecond = await invokeApi("GET", "/v1/accounts/acc_demo_alice_usd/balance");
  const afterSecondBalance = afterSecond.body.account.availableBalanceCents;
  assert.equal(afterSecondBalance, afterFirstBalance);
});

test("reusing idempotency key with different payload fails", async () => {
  const basePayload = {
    sourceAccountId: "acc_demo_alice_usd",
    destinationAccountId: "acc_demo_bob_usd",
    amountCents: 1000,
    currency: "USD"
  };

  const first = await invokeApi("POST", "/v1/payments", {
    body: basePayload,
    headers: { "idempotency-key": "demo-key-2" }
  });
  assert.equal(first.statusCode, 201);

  const second = await invokeApi("POST", "/v1/payments", {
    body: { ...basePayload, amountCents: 1100 },
    headers: { "idempotency-key": "demo-key-2" }
  });

  assert.equal(second.statusCode, 409);
  assert.equal(second.body.error.code, "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
});

test("high-risk payments go to manual review and skip ledger posting", async () => {
  const before = await invokeApi("GET", "/v1/accounts/acc_demo_alice_usd/balance");
  const beforeBalance = before.body.account.availableBalanceCents;

  const payment = await invokeApi("POST", "/v1/payments", {
    headers: { "idempotency-key": "demo-key-3" },
    body: {
      sourceAccountId: "acc_demo_alice_usd",
      destinationAccountId: "acc_demo_bob_usd",
      amountCents: 200000,
      currency: "USD",
      note: "Large transfer"
    }
  });

  assert.equal(payment.statusCode, 202);
  assert.equal(payment.body.payment.status, "manual_review");
  assert.equal(payment.body.ledgerPosted, false);

  const after = await invokeApi("GET", "/v1/accounts/acc_demo_alice_usd/balance");
  assert.equal(after.body.account.availableBalanceCents, beforeBalance);
});
