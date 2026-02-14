import { appendAuditLog } from "../core/auditLog.js";
import { ApiError } from "../core/errors.js";
import { createId, maskAccountNumber, store } from "../core/store.js";
import { sendJson } from "../utils/http.js";
import { validateAccountPayload } from "../utils/validation.js";

function formatAccount(account) {
  return {
    id: account.id,
    ownerCustomerId: account.ownerCustomerId,
    currency: account.currency,
    availableBalanceCents: account.availableBalanceCents,
    maskedAccountNumber: maskAccountNumber(account.accountNumber),
    createdAt: account.createdAt
  };
}

function generateDemoAccountNumber() {
  const suffix = String(Math.floor(Math.random() * 1_000_000_000_000)).padStart(12, "0");
  return `4455${suffix}`;
}

export function listAccounts(_req, res) {
  const accounts = Array.from(store.accounts.values()).map(formatAccount);
  sendJson(res, 200, { accounts });
}

export function createAccount(req, res) {
  const payload = req.body ?? {};
  validateAccountPayload(payload);

  const customer = store.customers.get(payload.customerId);
  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "customerId does not exist.");
  }

  const account = {
    id: createId("acc"),
    ownerCustomerId: customer.id,
    accountNumber: generateDemoAccountNumber(),
    currency: payload.currency.toUpperCase(),
    availableBalanceCents: payload.initialBalanceCents ?? 0,
    createdAt: new Date().toISOString()
  };

  store.accounts.set(account.id, account);

  appendAuditLog({
    eventType: "account.created",
    actorId: req.context.actorId,
    requestId: req.context.requestId,
    resourceType: "account",
    resourceId: account.id,
    metadata: {
      currency: account.currency,
      initialBalanceCents: account.availableBalanceCents,
      accountNumberRedacted: true
    }
  });

  sendJson(res, 201, { account: formatAccount(account) });
}

export function getAccountBalance(_req, res, accountId) {
  const account = store.accounts.get(accountId);
  if (!account) {
    throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Account does not exist.");
  }

  sendJson(res, 200, {
    account: {
      id: account.id,
      currency: account.currency,
      availableBalanceCents: account.availableBalanceCents
    }
  });
}

export function listLedgerEntries(req, res) {
  const paymentId = req.parsedUrl.searchParams.get("paymentId");
  const ledgerEntries = paymentId
    ? store.ledgerEntries.filter((entry) => entry.paymentId === paymentId)
    : store.ledgerEntries;

  sendJson(res, 200, { ledgerEntries });
}
