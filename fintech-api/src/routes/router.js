import { listAccounts, createAccount, getAccountBalance, listLedgerEntries } from "./accounts.js";
import { checkAuditIntegrity, listAuditLogs } from "./audit.js";
import { createCustomer, listCustomers } from "./customers.js";
import { handleHealth } from "./health.js";
import { createPayment, getPayment } from "./payments.js";

export function routeRequest(req, res) {
  const path = req.parsedUrl.pathname;

  if (req.method === "GET" && path === "/health") {
    handleHealth(req, res);
    return true;
  }

  if (req.method === "GET" && path === "/v1/customers") {
    listCustomers(req, res);
    return true;
  }

  if (req.method === "POST" && path === "/v1/customers") {
    createCustomer(req, res);
    return true;
  }

  if (req.method === "GET" && path === "/v1/accounts") {
    listAccounts(req, res);
    return true;
  }

  if (req.method === "POST" && path === "/v1/accounts") {
    createAccount(req, res);
    return true;
  }

  const accountBalanceMatch = path.match(/^\/v1\/accounts\/([^/]+)\/balance$/);
  if (req.method === "GET" && accountBalanceMatch) {
    getAccountBalance(req, res, accountBalanceMatch[1]);
    return true;
  }

  if (req.method === "GET" && path === "/v1/ledger") {
    listLedgerEntries(req, res);
    return true;
  }

  if (req.method === "POST" && path === "/v1/payments") {
    createPayment(req, res);
    return true;
  }

  const paymentMatch = path.match(/^\/v1\/payments\/([^/]+)$/);
  if (req.method === "GET" && paymentMatch) {
    getPayment(req, res, paymentMatch[1]);
    return true;
  }

  if (req.method === "GET" && path === "/v1/audit-logs") {
    listAuditLogs(req, res);
    return true;
  }

  if (req.method === "GET" && path === "/v1/audit-logs/verify") {
    checkAuditIntegrity(req, res);
    return true;
  }

  return false;
}
