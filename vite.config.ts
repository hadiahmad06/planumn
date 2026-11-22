import { defineConfig, type Plugin } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

/**
 * Hadi's Claude (#118 review): pdf2json bundles an old pdf.js whose own Promise runs callbacks from a
 * global queue, flushed by `setTimeout(…, 0)` behind a `running` flag. Workers cancel a request's
 * pending timers when its response is sent, so a flush still scheduled then leaves `running` stuck
 * and every later transcript parse in that isolate hangs until its 15 s timeout. A microtask flush
 * always runs within the request that queued it. Workers build only; `next build` is unchanged.
 */
function pdf2jsonMicrotaskQueue(): Plugin {
  const from = "setTimeout(this.runHandlers.bind(this),0)";
  const to = "queueMicrotask(this.runHandlers.bind(this))";
  return {
    name: "planumn:pdf2json-microtask-queue",
    enforce: "pre",
    transform(code, id) {
      if (!/[\\/]node_modules[\\/]pdf2json[\\/]dist[\\/]pdfparser\.(c?js)$/.test(id)) return null;
      if (!code.includes(from))
        throw new Error(`pdf2json changed: "${from}" not found in ${id}. Recheck transcript import on Workers (vite.config.ts).`);
      return { code: code.replace(from, to), map: null };
    },
  };
}

export default defineConfig({
  plugins: [
    pdf2jsonMicrotaskQueue(),
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
