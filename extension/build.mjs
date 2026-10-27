// Builds the APAS import extension for Chrome and Firefox. Written by Ishaan's Claude.
//   node extension/build.mjs          store builds   → extension/dist/{chrome,firefox}
//   node extension/build.mjs --dev    also allow http://localhost:3000 (never ship this)
//   node extension/build.mjs --dev --port 3220    … or another local dev port (Hadi's Claude)
// One manifest per browser (Chrome: service_worker; Firefox: background scripts + gecko settings),
// so neither browser has to tolerate the other's keys. No dependencies, no bundling (AMO reviews the
// files as written).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dev = process.argv.includes("--dev");
const portArg = process.argv[process.argv.indexOf("--port") + 1];
const port = process.argv.includes("--port") ? Number(portArg) : 3000;
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`--port must be a port number, got ${portArg}`);
const version = JSON.parse(readFileSync(path.join(here, "version.json"), "utf8")).version;

const APAS = "https://umn.uachieve.com";
const planumnOrigins = ["https://planu.mn", ...(dev ? [`http://localhost:${port}`] : [])];
// Match patterns can't carry a port in Firefox (a ":3000" pattern never matches there), and a
// port-less pattern matches every port in both browsers. The background still checks the exact
// origin (planumnOrigins) before it accepts a start request.
const planumnMatches = ["https://planu.mn/plan/*", ...(dev ? ["http://localhost/plan/*"] : [])];

const shared = {
  manifest_version: 3,
  name: dev ? "planu.mn APAS import (dev)" : "planu.mn APAS import",
  version,
  description: "Bring your UMN APAS report into planu.mn. You sign in to UMN yourself; the report goes only to your planu.mn tab.",
  permissions: ["storage"],
  host_permissions: [`${APAS}/*`, ...planumnMatches],
  action: { default_popup: "popup.html", default_title: "planu.mn APAS import" },
  content_scripts: [
    { matches: planumnMatches, js: ["protocol.js", "bridge.js"], run_at: "document_idle" },
    { matches: [`${APAS}/*`], js: ["protocol.js", "apas.js"], run_at: "document_idle" },
  ],
};

const manifests = {
  chrome: { ...shared, background: { service_worker: "background.js" } },
  firefox: {
    ...shared,
    background: { scripts: ["protocol.js", "background.js"] },
    browser_specific_settings: {
      gecko: {
        id: "apas-import@planu.mn",
        // data_collection_permissions needs Firefox 140+ (desktop).
        strict_min_version: "140.0",
        // The report moves between the student's own tabs and never leaves the browser
        // (docs/agent/apas-research.md §3/§6). Revisit if planu.mn ever uploads it.
        data_collection_permissions: { required: ["none"] },
      },
    },
  },
};

for (const [browser, manifest] of Object.entries(manifests)) {
  const out = path.join(here, "dist", browser);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(path.join(here, "src"), out, { recursive: true });
  const bg = path.join(out, "background.js");
  writeFileSync(bg, readFileSync(bg, "utf8").replace("__PLANUMN_ORIGINS__", JSON.stringify(planumnOrigins)));
  writeFileSync(path.join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`built ${path.relative(process.cwd(), out)}${dev ? ` (dev, localhost:${port})` : ""}`);
}
