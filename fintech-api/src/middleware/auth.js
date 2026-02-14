import { timingSafeEqual } from "node:crypto";
import { ApiError } from "../core/errors.js";

const DEMO_API_TOKEN = process.env.DEMO_API_TOKEN ?? "demo-fintech-token";

export function requireBearerAuth(req) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new ApiError(401, "AUTH_REQUIRED", "Provide Authorization: Bearer <token>.");
  }

  const provided = authorization.slice(7).trim();
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(DEMO_API_TOKEN);

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new ApiError(403, "AUTH_INVALID", "Invalid API token.");
  }
}
