import { ApiError, toErrorResponse } from "./core/errors.js";
import { requireBearerAuth } from "./middleware/auth.js";
import { parseJsonBody } from "./middleware/jsonBody.js";
import { attachRequestContext } from "./middleware/requestContext.js";
import { routeRequest } from "./routes/router.js";
import { sendJson } from "./utils/http.js";

function isPublicRoute(method, path) {
  return method === "GET" && path === "/health";
}

export async function handleRequest(req, res) {
  attachRequestContext(req, res);

  try {
    req.parsedUrl = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (!isPublicRoute(req.method, req.parsedUrl.pathname)) {
      requireBearerAuth(req);
    }

    req.body = await parseJsonBody(req);

    const handled = routeRequest(req, res);
    if (!handled) {
      throw new ApiError(404, "NOT_FOUND", "Route not found.");
    }
  } catch (error) {
    const { status, body } = toErrorResponse(error, req.context.requestId);
    sendJson(res, status, body);
  }
}
