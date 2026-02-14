import { appendAuditLog } from "../core/auditLog.js";
import { ApiError } from "../core/errors.js";
import { createId, store } from "../core/store.js";
import { sendJson } from "../utils/http.js";
import { validateCustomerPayload } from "../utils/validation.js";

function determineKycStatus(country) {
  if (["KP", "IR", "SY"].includes(country)) {
    return "manual_review";
  }
  return "verified";
}

export function listCustomers(_req, res) {
  const customers = Array.from(store.customers.values());
  sendJson(res, 200, { customers });
}

export function createCustomer(req, res) {
  const payload = req.body ?? {};
  validateCustomerPayload(payload);

  const country = payload.country.toUpperCase();
  const customer = {
    id: createId("cus"),
    name: payload.name.trim(),
    country,
    kycStatus: determineKycStatus(country),
    createdAt: new Date().toISOString()
  };

  const duplicate = Array.from(store.customers.values()).find(
    (existing) => existing.name === customer.name && existing.country === customer.country
  );
  if (duplicate) {
    throw new ApiError(409, "CUSTOMER_EXISTS", "A similar customer already exists in this demo store.");
  }

  store.customers.set(customer.id, customer);

  appendAuditLog({
    eventType: "customer.created",
    actorId: req.context.actorId,
    requestId: req.context.requestId,
    resourceType: "customer",
    resourceId: customer.id,
    metadata: {
      country: customer.country,
      kycStatus: customer.kycStatus,
      documentReferenceRedacted: true
    }
  });

  sendJson(res, 201, { customer });
}
