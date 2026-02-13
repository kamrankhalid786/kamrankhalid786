import { createHash } from "node:crypto";
import { ApiError } from "./errors.js";
import { store } from "./store.js";

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }

  return value;
}

function fingerprintPayload(payload) {
  const canonicalBody = JSON.stringify(canonicalize(payload ?? {}));
  return createHash("sha256").update(canonicalBody).digest("hex");
}

function buildKey(scope, idempotencyKey) {
  return `${scope}:${idempotencyKey}`;
}

export function getIdempotencyResult(scope, idempotencyKey, payload) {
  if (!idempotencyKey) {
    throw new ApiError(400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required.");
  }

  const internalKey = buildKey(scope, idempotencyKey);
  const existing = store.idempotencyKeys.get(internalKey);
  if (!existing) {
    return null;
  }

  const requestFingerprint = fingerprintPayload(payload);
  if (existing.fingerprint !== requestFingerprint) {
    throw new ApiError(
      409,
      "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD",
      "The same Idempotency-Key cannot be used with a different payload."
    );
  }

  return existing.response;
}

export function saveIdempotencyResult(scope, idempotencyKey, payload, response) {
  const internalKey = buildKey(scope, idempotencyKey);
  store.idempotencyKeys.set(internalKey, {
    fingerprint: fingerprintPayload(payload),
    createdAt: new Date().toISOString(),
    response
  });
}
