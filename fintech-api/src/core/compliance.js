const HIGH_RISK_COUNTRIES = new Set(["KP", "IR", "SY"]);
const AML_REVIEW_THRESHOLD_CENTS = 250000;

export function evaluateKyc(customer) {
  if (!customer) {
    return { status: "failed", reason: "customer_not_found" };
  }

  if (customer.kycStatus !== "verified") {
    return { status: "failed", reason: "kyc_not_verified" };
  }

  return { status: "passed", reason: null };
}

export function evaluateAml({ sourceCustomer, amountCents, note }) {
  const reasons = [];
  let action = "approve";

  if (HIGH_RISK_COUNTRIES.has(sourceCustomer.country)) {
    action = "reject";
    reasons.push("high_risk_jurisdiction");
  }

  if (amountCents >= AML_REVIEW_THRESHOLD_CENTS && action !== "reject") {
    action = "review";
    reasons.push("amount_above_review_threshold");
  }

  const lowered = (note ?? "").toLowerCase();
  if (/(crypto mixer|money mule|cash pickup)/.test(lowered)) {
    action = "review";
    reasons.push("suspicious_payment_note");
  }

  return {
    action,
    reasons
  };
}
