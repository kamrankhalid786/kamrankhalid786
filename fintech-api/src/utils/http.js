export function sendJson(res, statusCode, body, headers = {}) {
  const payload = JSON.stringify(body, null, 2);

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(payload));

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  res.end(payload);
}
