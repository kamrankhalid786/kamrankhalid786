import { store } from "../core/store.js";
import { verifyAuditChain } from "../core/auditLog.js";
import { sendJson } from "../utils/http.js";

export function listAuditLogs(req, res) {
  const limitRaw = req.parsedUrl.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 50;

  const logs = store.auditLogs.slice(-safeLimit);
  sendJson(res, 200, { logs, count: logs.length });
}

export function checkAuditIntegrity(_req, res) {
  const verification = verifyAuditChain();
  sendJson(res, verification.valid ? 200 : 500, { verification });
}
