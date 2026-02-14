import { ApiError } from "../core/errors.js";

const MAX_BODY_BYTES = 1_000_000;

export async function parseJsonBody(req) {
  const method = req.method ?? "GET";
  if (method === "GET" || method === "HEAD") {
    return null;
  }

  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_CONTENT_TYPE", "Use Content-Type: application/json.");
  }

  const chunks = [];
  let totalSize = 0;

  for await (const chunk of req) {
    totalSize += chunk.length;
    if (totalSize > MAX_BODY_BYTES) {
      throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds 1MB.");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new ApiError(400, "INVALID_JSON_BODY", "JSON body must be an object.");
    }
    return parsed;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, "INVALID_JSON", "Request body is not valid JSON.");
  }
}
