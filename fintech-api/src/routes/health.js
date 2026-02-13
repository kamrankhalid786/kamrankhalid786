import { sendJson } from "../utils/http.js";

export function handleHealth(_req, res) {
  sendJson(res, 200, {
    service: "fintech-api-demo",
    status: "ok",
    timestamp: new Date().toISOString()
  });
}
