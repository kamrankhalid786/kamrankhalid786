import { ApiError } from "../core/errors.js";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateCustomerPayload(payload) {
  if (!isNonEmptyString(payload.name)) {
    throw new ApiError(400, "VALIDATION_ERROR", "name is required.");
  }

  if (!isNonEmptyString(payload.country) || payload.country.trim().length !== 2) {
    throw new ApiError(400, "VALIDATION_ERROR", "country must be a 2-letter country code.");
  }

  if (!isNonEmptyString(payload.documentReference)) {
    throw new ApiError(400, "VALIDATION_ERROR", "documentReference is required.");
  }
}

export function validateAccountPayload(payload) {
  if (!isNonEmptyString(payload.customerId)) {
    throw new ApiError(400, "VALIDATION_ERROR", "customerId is required.");
  }

  if (!isNonEmptyString(payload.currency) || payload.currency.trim().length !== 3) {
    throw new ApiError(400, "VALIDATION_ERROR", "currency must be a 3-letter code, for example USD.");
  }

  if (
    payload.initialBalanceCents !== undefined &&
    (!Number.isInteger(payload.initialBalanceCents) || payload.initialBalanceCents < 0)
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", "initialBalanceCents must be a positive integer or zero.");
  }
}

export function validatePaymentPayload(payload) {
  if (!isNonEmptyString(payload.sourceAccountId)) {
    throw new ApiError(400, "VALIDATION_ERROR", "sourceAccountId is required.");
  }

  if (!isNonEmptyString(payload.destinationAccountId)) {
    throw new ApiError(400, "VALIDATION_ERROR", "destinationAccountId is required.");
  }

  if (payload.sourceAccountId === payload.destinationAccountId) {
    throw new ApiError(400, "VALIDATION_ERROR", "source and destination accounts must differ.");
  }

  if (!Number.isInteger(payload.amountCents) || payload.amountCents <= 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "amountCents must be a positive integer.");
  }

  if (!isNonEmptyString(payload.currency) || payload.currency.trim().length !== 3) {
    throw new ApiError(400, "VALIDATION_ERROR", "currency must be a 3-letter code, for example USD.");
  }

  if (payload.note !== undefined && typeof payload.note !== "string") {
    throw new ApiError(400, "VALIDATION_ERROR", "note must be a string if provided.");
  }
}
