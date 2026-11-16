/**
 * Local Mock Server standing in for the Google Apps Script web app.
 *
 * It is a REAL HTTP server bound to 127.0.0.1 on a free port; every test POST goes
 * through a real socket. No test ever contacts script.google.com. It mimics the
 * contract: a POST with the right token stores one row per attemptId and answers
 * {ok:true}; repeating an attemptId does not add a row and answers duplicate:true.
 * It can also fail the way a real network fails (reset / hang / HTML / empty / ok:false).
 */
import http from "node:http";
import type { AddressInfo, Socket } from "node:net";
import type { FetchLike } from "../src/logic/submit";

export interface ReceivedPost {
  method: string;
  path: string;
  contentType: string;
  body: string;
  json: any;
  at: number;
}

export type Behaviour =
  | "apps-script"
  | "ok-false"
  | "http-500"
  | "html-page"
  | "empty"
  | "reset"
  | "hang";

export class MockSheetsServer {
  readonly posts: ReceivedPost[] = [];
  /** The "sheet": exactly one stored payload per attemptId. */
  readonly rows = new Map<string, any>();
  queue: Behaviour[] = [];
  behaviour: Behaviour = "apps-script";
  duplicateReply: Record<string, unknown> = { ok: true, duplicate: true };
  redirect = true;
  delayMs = 0;
  url = "";

  private server: http.Server;
  private sockets = new Set<Socket>();
  private replies = new Map<string, string>();
  private counter = 0;

  constructor(readonly token: string) {
    this.server = http.createServer((req, res) => this.handle(req, res));
    this.server.on("connection", (socket) => {
      this.sockets.add(socket);
      socket.on("close", () => this.sockets.delete(socket));
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(0, "127.0.0.1", () => {
        const { port } = this.server.address() as AddressInfo;
        this.url = "http://127.0.0.1:" + port + "/macros/s/MOCK-DEPLOYMENT/exec";
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    for (const socket of this.sockets) socket.destroy();
    return new Promise((resolve) => this.server.close(() => resolve()));
  }

  reset(): void {
    this.posts.length = 0;
    this.rows.clear();
    this.queue = [];
    this.behaviour = "apps-script";
    this.duplicateReply = { ok: true, duplicate: true };
    this.redirect = true;
    this.delayMs = 0;
  }

  private handle(req: http.IncomingMessage, res: http.ServerResponse): void {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("error", () => undefined);
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");

      // Second leg of the Apps Script-style 302 redirect.
      if (req.method === "GET" && requestUrl.pathname === "/macros/echo") {
        const reply = this.replies.get(requestUrl.searchParams.get("id") ?? "");
        res.writeHead(reply === undefined ? 404 : 200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(reply ?? "{}");
        return;
      }

      let json: any = null;
      try {
        json = JSON.parse(body);
      } catch {
        json = null;
      }
      this.posts.push({
        method: req.method ?? "",
        path: requestUrl.pathname,
        contentType: String(req.headers["content-type"] ?? ""),
        body,
        json,
        at: Date.now(),
      });

      const behaviour = this.queue.shift() ?? this.behaviour;
      switch (behaviour) {
        case "hang":
          return; // never answers; stop() destroys the socket
        case "reset":
          req.socket.destroy();
          return;
        case "http-500":
          res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<!doctype html><title>Error</title>");
          return;
        case "html-page":
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<!doctype html><title>Sign in</title>");
          return;
        case "empty":
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end("");
          return;
        case "ok-false":
          this.answer(res, { ok: false, error: "rejected by the mock" });
          return;
        default: {
          if (req.method !== "POST" || !json || typeof json !== "object") {
            this.answer(res, { ok: false, error: "bad request" });
          } else if (json.token !== this.token) {
            this.answer(res, { ok: false, error: "unauthorized" });
          } else if (this.rows.has(String(json.attemptId))) {
            this.answer(res, this.duplicateReply);
          } else {
            this.rows.set(String(json.attemptId), json);
            this.answer(res, { ok: true });
          }
        }
      }
    });
  }

  private answer(res: http.ServerResponse, reply: Record<string, unknown>): void {
    if (this.delayMs > 0) setTimeout(() => this.answerNow(res, reply), this.delayMs);
    else this.answerNow(res, reply);
  }

  private answerNow(res: http.ServerResponse, reply: Record<string, unknown>): void {
    const text = JSON.stringify(reply);
    if (!this.redirect) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(text);
      return;
    }
    const id = String(++this.counter);
    this.replies.set(id, text);
    res.writeHead(302, { Location: "/macros/echo?id=" + id });
    res.end();
  }
}

/** A fetchImpl that records the request and forwards it to the local mock over real HTTP. */
export function forwardTo(server: MockSheetsServer, realFetch: typeof fetch = fetch) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    calls.push({ url, init });
    return realFetch(server.url, init);
  };
  return { fetchImpl, calls };
}
