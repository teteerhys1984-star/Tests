/**
 * خادم بديل محلي عن تطبيق Google Apps Script، للاختبار فقط (http://127.0.0.1:<port>).
 *
 * يتصرف كما يفترض عقد الإرسال أن يتصرف التطبيق الحقيقي:
 *  · طلب POST بجسم JSON فيه الرمز الصحيح يُخزَّن بمفتاح attemptId ويُجاب بـ {ok:true}؛
 *  · طلب POST يكرّر attemptId مخزّناً لا يُخزَّن ثانيةً ويُجاب بـ duplicate:true؛
 *  · الجواب يُعطى كما يعطيه Apps Script: 302 إلى رابط آخر، يُعيد JSON عند طلبه.
 * ويمكن إجباره على الفشل بالطرق التي تفشل بها الشبكة الحقيقية (انظر Behaviour).
 *
 * لا يلمس أي اختبار النقطة الحقيقية.
 */
import http from "node:http";
import type { AddressInfo, Socket } from "node:net";

export interface ReceivedPost {
  method: string;
  path: string;
  contentType: string;
  body: string;
  json: any;
  at: number;
}

export type Behaviour =
  | "apps-script" // يفحص الرمز، يخزّن بـ attemptId، يجيب {ok:true} أو duplicate
  | "ok-false" // 200 {"ok":false,"error":"…"}
  | "http-500" // 500 مع صفحة HTML
  | "html-page" // 200 مع صفحة HTML (ما يعيده تطبيق يحتاج تسجيل دخول)
  | "empty" // 200 بجسم فارغ
  | "reset" // إغلاق الاتصال بلا جواب
  | "hang"; // لا جواب أبداً (مهلة العميل هي التي تنهي المحاولة)

export class MockSheetsServer {
  readonly posts: ReceivedPost[] = [];
  /** «الجدول»: حمولة واحدة مخزّنة لكل attemptId. */
  readonly rows = new Map<string, any>();
  /** سلوكيات الطلبات القادمة (واحد لكل طلب)؛ وعند خلوّها يُستعمل behaviour. */
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
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");

      // الشوط الثاني من الجواب: الرابط الذي وجّه إليه 302.
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
          return; // لا جواب؛ stop() يغلق الاتصال
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

/** fetch يسجّل كل طلب ويحمله كما هو إلى الخادم البديل عبر HTTP حقيقي. */
export function forwardTo(server: MockSheetsServer, realFetch: typeof fetch = fetch) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return realFetch(server.url, init);
  };
  return { fetchImpl, calls };
}
