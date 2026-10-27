/**
 * Messages between the planu.mn page and the APAS import extension (B1 step 1). Owned by Ishaan's Claude.
 * The extension's copy is extension/src/protocol.js; protocol.test.ts keeps the two in sync.
 */
export const APAS_PROTOCOL = {
  PAGE_SOURCE: "planumn-page",
  EXTENSION_SOURCE: "planumn-extension",
  HELLO: "planumn:apas:hello",
  READY: "planumn:apas:ready",
  START: "planumn:apas:start",
  STATUS: "planumn:apas:status",
  REPORT: "planumn:apas:report",
  APAS_URL: "https://umn.uachieve.com/",
  APAS_ORIGIN: "https://umn.uachieve.com",
  PLANUMN_PATH_PREFIX: "/plan/",
  MAX_REPORT_BYTES: 5 * 1024 * 1024,
} as const;

/** The raw APAS page the student chose to send. Held in memory only; never stored or uploaded. */
export interface ApasReport {
  html: string;
  url: string;
  title: string;
  capturedAt: string;
}

export type ExtensionMessage =
  | { type: typeof APAS_PROTOCOL.READY; version: string }
  | { type: typeof APAS_PROTOCOL.STATUS; nonce: string; status: "opened" | "cancelled" | "error" }
  | { type: typeof APAS_PROTOCOL.REPORT; nonce: string; report: ApasReport };

const isString = (v: unknown): v is string => typeof v === "string";

/**
 * Validates a `message` event from the bridge. Returns the message only if it was posted to this
 * window by this origin, comes from the extension, and (for status/report) carries our nonce.
 */
export function readExtensionMessage(
  event: { data: unknown; origin: string; source: unknown },
  self: { origin: string; window: unknown },
  nonce: string | null,
): ExtensionMessage | null {
  if (event.source !== self.window || event.origin !== self.origin) return null;
  const d = event.data as Record<string, unknown> | null;
  if (!d || typeof d !== "object" || d.source !== APAS_PROTOCOL.EXTENSION_SOURCE) return null;

  if (d.type === APAS_PROTOCOL.READY) return { type: APAS_PROTOCOL.READY, version: isString(d.version) ? d.version : "" };
  if (!nonce || d.nonce !== nonce) return null;

  if (d.type === APAS_PROTOCOL.STATUS && (d.status === "opened" || d.status === "cancelled" || d.status === "error"))
    return { type: APAS_PROTOCOL.STATUS, nonce, status: d.status };

  if (d.type === APAS_PROTOCOL.REPORT) {
    const r = d.report as Record<string, unknown> | null;
    if (!r || !isString(r.html) || !isString(r.url) || r.html.length === 0 || r.html.length > APAS_PROTOCOL.MAX_REPORT_BYTES) return null;
    let origin: string;
    try {
      origin = new URL(r.url).origin;
    } catch {
      return null;
    }
    if (origin !== APAS_PROTOCOL.APAS_ORIGIN) return null;
    return {
      type: APAS_PROTOCOL.REPORT,
      nonce,
      report: { html: r.html, url: r.url, title: isString(r.title) ? r.title : "", capturedAt: isString(r.capturedAt) ? r.capturedAt : "" },
    };
  }
  return null;
}

/** 128-bit random nonce for one import. */
export function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function pageMessage(type: typeof APAS_PROTOCOL.HELLO | typeof APAS_PROTOCOL.START, nonce?: string) {
  return { source: APAS_PROTOCOL.PAGE_SOURCE, type, ...(nonce ? { nonce } : {}) };
}
