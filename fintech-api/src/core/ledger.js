import { ApiError } from "./errors.js";
import { createId, store } from "./store.js";

export function postLedgerTransfer({ paymentId, sourceAccount, destinationAccount, amountCents, requestId }) {
  if (sourceAccount.currency !== destinationAccount.currency) {
    throw new ApiError(422, "CURRENCY_MISMATCH", "Source and destination accounts must use the same currency.");
  }

  if (sourceAccount.availableBalanceCents < amountCents) {
    throw new ApiError(422, "INSUFFICIENT_FUNDS", "Source account does not have enough balance.");
  }

  sourceAccount.availableBalanceCents -= amountCents;
  destinationAccount.availableBalanceCents += amountCents;

  const timestamp = new Date().toISOString();

  const debit = {
    id: createId("led"),
    paymentId,
    accountId: sourceAccount.id,
    direction: "debit",
    amountCents,
    currency: sourceAccount.currency,
    requestId,
    timestamp
  };

  const credit = {
    id: createId("led"),
    paymentId,
    accountId: destinationAccount.id,
    direction: "credit",
    amountCents,
    currency: destinationAccount.currency,
    requestId,
    timestamp
  };

  store.ledgerEntries.push(debit, credit);
  return { debit, credit };
}
