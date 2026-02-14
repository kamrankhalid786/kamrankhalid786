import { appendAuditLog } from "../core/auditLog.js";
import { evaluateAml, evaluateKyc } from "../core/compliance.js";
import { ApiError } from "../core/errors.js";
import { evaluateFraud } from "../core/fraud.js";
import { getIdempotencyResult, saveIdempotencyResult } from "../core/idempotency.js";
import { postLedgerTransfer } from "../core/ledger.js";
import { createId, store } from "../core/store.js";
import { sendJson } from "../utils/http.js";
import { validatePaymentPayload } from "../utils/validation.js";

function summarizePayment(payment) {
  return {
    id: payment.id,
    status: payment.status,
    sourceAccountId: payment.sourceAccountId,
    destinationAccountId: payment.destinationAccountId,
    amountCents: payment.amountCents,
    currency: payment.currency,
    note: payment.note,
    reasons: payment.reasons,
    createdAt: payment.createdAt
  };
}

export function createPayment(req, res) {
  const payload = req.body ?? {};
  validatePaymentPayload(payload);

  const idempotencyKey = req.headers["idempotency-key"];
  const scope = "POST:/v1/payments";

  const replay = getIdempotencyResult(scope, idempotencyKey, payload);
  if (replay) {
    sendJson(res, replay.statusCode, replay.body, {
      "Idempotency-Replayed": "true"
    });
    return;
  }

  const sourceAccount = store.accounts.get(payload.sourceAccountId);
  if (!sourceAccount) {
    throw new ApiError(404, "SOURCE_ACCOUNT_NOT_FOUND", "sourceAccountId does not exist.");
  }

  const destinationAccount = store.accounts.get(payload.destinationAccountId);
  if (!destinationAccount) {
    throw new ApiError(404, "DESTINATION_ACCOUNT_NOT_FOUND", "destinationAccountId does not exist.");
  }

  const sourceCustomer = store.customers.get(sourceAccount.ownerCustomerId);
  const kyc = evaluateKyc(sourceCustomer);
  if (kyc.status !== "passed") {
    throw new ApiError(403, "KYC_REQUIRED", "Sender KYC must be verified before initiating payments.");
  }

  const aml = evaluateAml({
    sourceCustomer,
    amountCents: payload.amountCents,
    note: payload.note
  });

  const fraud = evaluateFraud({
    sourceAccountId: payload.sourceAccountId,
    destinationAccountId: payload.destinationAccountId,
    amountCents: payload.amountCents
  });

  let status = "posted";
  const reasons = [...aml.reasons, ...fraud.reasons];

  if (aml.action === "reject") {
    status = "declined";
  } else if (aml.action === "review" || fraud.action === "review") {
    status = "manual_review";
  }

  const payment = {
    id: createId("pay"),
    sourceAccountId: sourceAccount.id,
    destinationAccountId: destinationAccount.id,
    amountCents: payload.amountCents,
    currency: payload.currency.toUpperCase(),
    note: payload.note ?? null,
    status,
    reasons,
    createdAt: new Date().toISOString()
  };

  let ledgerTransfer = null;
  if (status === "posted") {
    ledgerTransfer = postLedgerTransfer({
      paymentId: payment.id,
      sourceAccount,
      destinationAccount,
      amountCents: payment.amountCents,
      requestId: req.context.requestId
    });
  }

  store.payments.set(payment.id, payment);

  appendAuditLog({
    eventType: "payment.created",
    actorId: req.context.actorId,
    requestId: req.context.requestId,
    resourceType: "payment",
    resourceId: payment.id,
    metadata: {
      status: payment.status,
      amountCents: payment.amountCents,
      currency: payment.currency,
      sourceAccountId: payment.sourceAccountId,
      destinationAccountId: payment.destinationAccountId
    }
  });

  if (ledgerTransfer) {
    appendAuditLog({
      eventType: "payment.ledger_posted",
      actorId: req.context.actorId,
      requestId: req.context.requestId,
      resourceType: "payment",
      resourceId: payment.id,
      metadata: {
        ledgerEntryIds: [ledgerTransfer.debit.id, ledgerTransfer.credit.id]
      }
    });
  }

  const statusCode = payment.status === "posted" ? 201 : payment.status === "manual_review" ? 202 : 422;
  const body = {
    payment: summarizePayment(payment),
    ledgerPosted: Boolean(ledgerTransfer)
  };

  saveIdempotencyResult(scope, idempotencyKey, payload, {
    statusCode,
    body
  });

  sendJson(res, statusCode, body, {
    "Idempotency-Replayed": "false"
  });
}

export function getPayment(_req, res, paymentId) {
  const payment = store.payments.get(paymentId);
  if (!payment) {
    throw new ApiError(404, "PAYMENT_NOT_FOUND", "Payment does not exist.");
  }

  const ledgerEntries = store.ledgerEntries.filter((entry) => entry.paymentId === paymentId);

  sendJson(res, 200, {
    payment: summarizePayment(payment),
    ledgerEntries
  });
}
