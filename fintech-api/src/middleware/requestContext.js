import { randomUUID } from "node:crypto";

export function attachRequestContext(req, res) {
  const incomingId = req.headers["x-request-id"];
  const requestId = typeof incomingId === "string" && incomingId.trim() ? incomingId : randomUUID();

  req.context = {
    requestId,
    actorId: "api_client",
    startedAt: Date.now()
  };

  res.setHeader("X-Request-Id", requestId);
}
