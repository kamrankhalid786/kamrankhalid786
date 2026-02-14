import { store } from "./store.js";

const WINDOW_MS = 60_000;

function isRecent(timestamp, nowMs) {
  return nowMs - Date.parse(timestamp) <= WINDOW_MS;
}

export function evaluateFraud({ sourceAccountId, destinationAccountId, amountCents }) {
  const nowMs = Date.now();
  store.recentPaymentAttempts = store.recentPaymentAttempts.filter((entry) => isRecent(entry.timestamp, nowMs));

  const reasons = [];
  let action = "approve";

  const recentFromSource = store.recentPaymentAttempts.filter(
    (entry) => entry.sourceAccountId === sourceAccountId
  );
  if (recentFromSource.length >= 3) {
    action = "review";
    reasons.push("high_velocity_source_account");
  }

  const repeatedTransfer = recentFromSource.find(
    (entry) =>
      entry.destinationAccountId === destinationAccountId &&
      entry.amountCents === amountCents
  );
  if (repeatedTransfer) {
    action = "review";
    reasons.push("repeated_payment_pattern");
  }

  if (amountCents >= 175000) {
    action = "review";
    reasons.push("amount_above_fraud_review_threshold");
  }

  store.recentPaymentAttempts.push({
    sourceAccountId,
    destinationAccountId,
    amountCents,
    timestamp: new Date(nowMs).toISOString()
  });

  return { action, reasons };
}
