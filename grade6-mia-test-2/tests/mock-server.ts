/**
 * A local stand-in for the Google Apps Script web app, for tests only (http://127.0.0.1:<port>).
 *
 * It behaves the way the delivery contract expects the real web app to behave:
 *  · a POST whose body is JSON with the right token is stored by attemptId and answered {ok:true};
 *  · a POST that repeats a stored attemptId is not stored again and is answered with duplicate:true;
 *  · the answer is given the way Apps Script gives it: 302 to another URL, whose GET returns the JSON.
 * It can also be told to fail in the ways a real network fails (see Behaviour).
 *
 * The real endpoint is never contacted by any test.
 */
import http from "node:http";
import type { AddressInfo, Socket } from "node:net";

export interface ReceivedPost {
  method: string;
  path: string;
  contentType: string;
  body: string;
  /** The parsed body, or null when it is not JSON. */
  json: any;
  at: number;
}

export type Behaviour =
  | "apps-script" // check the token, store by attemptId, answer {ok:true} or duplicate
  | "ok-false" // 200 {"ok":false,"error":"…"}
  | "http-500" // 500 with an HTML error page
  | "html-page" // 200 with an HTML page (what a web app that needs a login returns)
  | "empty" // 200 with an empty body
  | "reset" // the connection is closed without an answer
  | "hang"; // no answer at all (the client's time limit has to end the try)

export class MockSheetsServer {
  /** Every POST received, in order. */
  readonly posts: ReceivedPost[] = [];
  /** The "sheet": one stored payload per attemptId. */
  readonly rows = new Map<string, any>();
  /** Behaviours for the next POSTs (one each); when empty, `behaviour` applies. */
  queue: Behaviour[] = [];
  behaviour: Behaviour = "apps-script";
  /** What a repeated attemptId is answered with. */
  duplicateReply: Record<string, unknown> = { ok: true, duplicate: true };
  /** Answer through a 302 redirect, as Apps Script does. */
  redirect = true;
  /** Time the server takes before it answers. */
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

  /** Forget everything received and stored, and go back to normal behaviour. */
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
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");

      // Second leg of an answer: the URL the 302 pointed to.
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
          return; // never answered; stop() closes the socket
        case "reset":
          req.socket.destroy();
          return;
        case "http-500":
          res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<!doctype html><title>Error</title><p>Internal error</p>");
          return;
        case "html-page":
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<!doctype html><title>Sign in</title><p>Sign in to continue</p>");
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
    if (this.delayMs > 0) {
      const delay = this.delayMs;
      setTimeout(() => this.answerNow(res, reply), delay);
    } else {
      this.answerNow(res, reply);
    }
  }

  private answerNow(res: http.ServerResponse, reply: Record<string, unknown>): void {
    const text = JSON.stringify(reply);
    if (!this.redirect) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(text);
      return;
    }
    this.counter += 1;
    const id = String(this.counter);
    this.replies.set(id, text);
    res.writeHead(302, { Location: "/macros/echo?id=" + id });
    res.end();
  }
}

/** A fetch that records each call and carries it, unchanged, to the mock server over real HTTP. */
export function forwardTo(server: MockSheetsServer, realFetch: typeof fetch = fetch) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return realFetch(server.url, init);
  };
  return { fetchImpl, calls };
}
