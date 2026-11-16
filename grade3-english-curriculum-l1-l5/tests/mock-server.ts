import http from "node:http";
import type { AddressInfo } from "node:net";
import type { FetchLike } from "../src/logic/submit";

export interface RecordedPost {
  method: string;
  contentType: string;
  rawBody: string;
  json: any;
}

export type MockAction = "ok" | "reset" | "bad-json" | "false" | { status: number; body: string };

/**
 * Local HTTP server on 127.0.0.1 simulating Google Apps Script web app:
 *   - checks token
 *   - de-duplicates rows by attemptId (returns { ok: true, duplicate: true })
 *   - supports programmable failures via `queue`
 */
export class MockSheetsServer {
  readonly token: string;
  server: http.Server | null = null;
  url = "";
  posts: RecordedPost[] = [];
  rows = new Map<string, any>();
  queue: MockAction[] = [];

  constructor(token: string) {
    this.token = token;
  }

  reset(): void {
    this.posts = [];
    this.rows.clear();
    this.queue = [];
  }

  async start(): Promise<void> {
    if (this.server) return;
    this.server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c: Buffer) => chunks.push(c));
      req.on("end", () => {
        const rawBody = Buffer.concat(chunks).toString("utf8");
        let json: any = null;
        try {
          json = JSON.parse(rawBody);
        } catch {
          json = null;
        }
        const contentType = String(req.headers["content-type"] ?? "");
        this.posts.push({ method: req.method ?? "", contentType, rawBody, json });

        const next = this.queue.shift() ?? "ok";
        if (next === "reset") {
          req.socket.destroy();
          return;
        }
        if (next === "bad-json") {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end("<html>unexpected</html>");
          return;
        }
        if (next === "false") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false }));
          return;
        }
        if (typeof next === "object") {
          res.writeHead(next.status, { "Content-Type": "text/plain" });
          res.end(next.body);
          return;
        }

        if (!json || json.token !== this.token || !json.attemptId) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
          return;
        }

        if (this.rows.has(json.attemptId)) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, duplicate: true, attemptId: json.attemptId }));
          return;
        }

        this.rows.set(json.attemptId, json);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, duplicate: false, attemptId: json.attemptId }));
      });
    });

    await new Promise<void>((resolve) => {
      this.server!.listen(0, "127.0.0.1", () => {
        const addr = this.server!.address() as AddressInfo;
        this.url = `http://127.0.0.1:${addr.port}/exec`;
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    await new Promise<void>((resolve) => this.server!.close(() => resolve()));
    this.server = null;
    this.url = "";
  }
}

/** Redirects SHEETS_URL calls to the local MockSheetsServer while recording the original init. */
export function forwardTo(server: MockSheetsServer, nativeFetch: typeof fetch): {
  fetchImpl: FetchLike;
  calls: { url: string; init: RequestInit }[];
} {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return nativeFetch(server.url, init);
  };
  return { fetchImpl, calls };
}
