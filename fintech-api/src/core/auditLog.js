import { createHash } from "node:crypto";
import { createId, store } from "./store.js";

function hashObject(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function appendAuditLog({ eventType, actorId, requestId, resourceType, resourceId, metadata = {} }) {
  const previous = store.auditLogs.at(-1);
  const prevHash = previous ? previous.hash : "GENESIS";

  const entry = {
    id: createId("audit"),
    timestamp: new Date().toISOString(),
    eventType,
    actorId,
    requestId,
    resourceType,
    resourceId,
    metadata,
    prevHash
  };

  entry.hash = hashObject(entry);
  store.auditLogs.push(entry);
  return entry;
}

export function verifyAuditChain() {
  for (let index = 0; index < store.auditLogs.length; index += 1) {
    const entry = store.auditLogs[index];
    const previous = store.auditLogs[index - 1];
    const expectedPrevHash = previous ? previous.hash : "GENESIS";

    if (entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAtIndex: index,
        reason: "prevHash mismatch"
      };
    }

    const { hash, ...withoutHash } = entry;
    const recalculatedHash = hashObject(withoutHash);
    if (hash !== recalculatedHash) {
      return {
        valid: false,
        brokenAtIndex: index,
        reason: "hash mismatch"
      };
    }
  }

  return { valid: true, brokenAtIndex: null, reason: null };
}
