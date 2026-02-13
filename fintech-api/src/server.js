import { createServer } from "node:http";
import { handleRequest } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const server = createServer((req, res) => {
  handleRequest(req, res);
});

server.listen(port, () => {
  process.stdout.write(`Fintech API demo listening on http://localhost:${port}\n`);
  process.stdout.write("Use Authorization: Bearer demo-fintech-token (or DEMO_API_TOKEN env var).\n");
});
