/**
 * Shared constants for the planu.mn APAS import extension (B1 step 1). Written by Ishaan's Claude.
 * The page-side copy lives in src/features/apas/protocol.ts; src/features/apas/protocol.test.ts
 * fails if the two drift apart.
 */
// A global on purpose: content scripts and Firefox background scripts share it by load order.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var PLANUMN_APAS = {
  // window.postMessage between the planu.mn page and the bridge content script
  PAGE_SOURCE: "planumn-page",
  EXTENSION_SOURCE: "planumn-extension",
  HELLO: "planumn:apas:hello",
  READY: "planumn:apas:ready",
  START: "planumn:apas:start",
  STATUS: "planumn:apas:status",
  REPORT: "planumn:apas:report",
  // Where the import starts. [unverified] exact landing path; One Stop links the host root.
  APAS_URL: "https://umn.uachieve.com/",
  APAS_ORIGIN: "https://umn.uachieve.com",
  // The bridge only runs on the import route (Hadi's review of #28).
  PLANUMN_PATH_PREFIX: "/plan/",
  MAX_REPORT_BYTES: 5 * 1024 * 1024,
};
