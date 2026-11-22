// @vitest-environment happy-dom
/** A2 (#100), Hadi's Claude: the APAS import flag and every entry point it hides. */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import ApasPage from "@/app/plan/apas/page";
import { CatalogUpdates } from "@/features/catalog-changes/CatalogUpdates";
import { MyPlans } from "@/features/plans/MyPlans";
import { TranscriptImport } from "@/features/transcript/TranscriptImport";
import { ApasImportLink } from "./ApasImportLink";
import { apasImportEnabled, apasImportFlag } from "./flag";

// The account menu needs a mounted app router; the Catalog updates modal is shown open so its B21
// reminder renders.
vi.mock("@/features/auth/UserMenu", () => ({ UserMenu: () => null }));
vi.mock("@/components/ui/Modal", async () => {
  const { createElement: h } = await import("react");
  return { Modal: ({ title, children }: { title: string; children: ReactNode }) => h("section", null, h("h2", null, title), children) };
});

const html = (el: ReactElement) => renderToStaticMarkup(el);
const flag = (value: string | undefined, nodeEnv = "production") => {
  vi.stubEnv("NEXT_PUBLIC_APAS_IMPORT", value);
  vi.stubEnv("NODE_ENV", nodeEnv);
};
afterEach(() => vi.unstubAllEnvs());

describe("apasImportFlag", () => {
  it("is on under next dev and off in every other build when unset", () => {
    expect(apasImportFlag(undefined, "development")).toBe(true);
    expect(apasImportFlag(undefined, "production")).toBe(false);
    expect(apasImportFlag(undefined, "test")).toBe(false);
    expect(apasImportFlag("", "development")).toBe(true);
    expect(apasImportFlag(undefined, undefined)).toBe(false);
  });

  it("follows an explicit 1/true or 0/false in any build", () => {
    for (const on of ["1", "true", "TRUE", " 1 "]) {
      expect(apasImportFlag(on, "production")).toBe(true);
      expect(apasImportFlag(on, "development")).toBe(true);
    }
    for (const off of ["0", "false", "False"]) {
      expect(apasImportFlag(off, "production")).toBe(false);
      expect(apasImportFlag(off, "development")).toBe(false);
    }
  });

  it("treats any other value as unset", () => {
    expect(apasImportFlag("yes", "production")).toBe(false);
    expect(apasImportFlag("yes", "development")).toBe(true);
  });

  it("reads NEXT_PUBLIC_APAS_IMPORT and NODE_ENV", () => {
    flag(undefined, "production");
    expect(apasImportEnabled()).toBe(false);
    flag(undefined, "development");
    expect(apasImportEnabled()).toBe(true);
    flag("1", "production");
    expect(apasImportEnabled()).toBe(true);
    flag("0", "development");
    expect(apasImportEnabled()).toBe(false);
  });
});

describe("with the flag off, no link to /plan/apas renders", () => {
  it("ApasImportLink renders nothing when off and a full-navigation link when on", () => {
    flag("0");
    expect(html(createElement(ApasImportLink, null, "Import from APAS"))).toBe("");
    flag("1");
    expect(html(createElement(ApasImportLink, { className: "x" }, "Import from APAS"))).toBe(
      '<a href="/plan/apas" class="x">Import from APAS</a>',
    );
  });

  it("My Plans", () => {
    flag("0");
    const off = html(createElement(MyPlans));
    expect(off).toContain("Import transcript");
    expect(off).not.toContain("/plan/apas");
    expect(off).not.toContain("APAS");
    flag("1");
    expect(html(createElement(MyPlans))).toContain('href="/plan/apas"');
  });

  it("transcript import (the whole extension line goes)", () => {
    flag("0");
    const off = html(createElement(TranscriptImport));
    expect(off).toContain("unofficial transcript");
    expect(off).not.toContain("/plan/apas");
    expect(off).not.toContain("extension");
    flag("1");
    expect(html(createElement(TranscriptImport))).toContain('href="/plan/apas"');
  });

  it("the B21 APAS reminder in Catalog updates (text and link go)", () => {
    flag("0");
    const off = html(createElement(CatalogUpdates));
    expect(off).toContain("Catalog updates");
    expect(off).toContain("<h2>Catalog updates</h2>");
    expect(off).not.toContain("/plan/apas");
    expect(off).not.toContain("Re-sync your APAS");
    flag("1");
    const on = html(createElement(CatalogUpdates));
    expect(on).toContain('href="/plan/apas"');
    expect(on).toContain("Re-sync your APAS");
    expect(on).toContain("<h2>Catalog updates &amp; APAS</h2>");
  });

  // Reviewer C on #103: any string literal naming /plan/apas counts, so `location.assign(...)`,
  // `router.push(...)` and a constant later used as an href are caught too, not just `href="..."`.
  const apasPath = /["'`]\/plan\/apas(?:[/?#"'`$])/;
  it("the /plan/apas scan catches every way of linking there", () => {
    for (const code of [
      '<a href="/plan/apas">',
      "<Link href={`/plan/apas`}>",
      'location.assign("/plan/apas")',
      "window.location.href = '/plan/apas?x=1'",
      'router.push("/plan/apas")',
      'redirect("/plan/apas/")',
      'const APAS = "/plan/apas"; <a href={APAS} />',
    ])
      expect(apasPath.test(code), code).toBe(true);
    expect(apasPath.test('"/plan/apasx"')).toBe(false);
    expect(apasPath.test('"/plan/autosave"')).toBe(false);
  });

  it("no file names /plan/apas except ApasImportLink (and analytics' list of paths, which is not a link)", () => {
    const root = path.resolve(__dirname, "../..");
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? files(p) : /\.(tsx?|jsx?)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
      });
    const allowed = [path.join("features", "apas", "ApasImportLink.tsx"), path.join("features", "marketing", "analytics.ts")];
    // Comments may mention the path; code may not.
    const code = (f: string) =>
      readFileSync(f, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|\s)\/\/.*$/gm, "$1");
    const naming = files(root)
      .filter((f) => apasPath.test(code(f)))
      .map((f) => path.relative(root, f))
      .sort();
    expect(naming).toEqual([...allowed].sort());
    // analytics.ts only lists it among the paths it skips; it must never navigate there.
    const analytics = readFileSync(path.join(root, allowed[1]), "utf8");
    expect(analytics).not.toMatch(/(href|assign|push|replace|redirect|prefetch|location)\b[^\n]*\/plan\/apas/);
    // Every entry point that used to link there now goes through the gated link.
    for (const f of ["features/plans/MyPlans.tsx", "features/transcript/TranscriptImport.tsx", "features/catalog-changes/CatalogUpdates.tsx"])
      expect(readFileSync(path.join(root, f), "utf8")).toContain("<ApasImportLink");
  });
});

describe("/plan/apas", () => {
  it("is a 404 with the flag off", () => {
    flag("0");
    let thrown: unknown;
    try {
      ApasPage();
    } catch (e) {
      thrown = e;
    }
    expect((thrown as { digest?: string } | undefined)?.digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("renders the import with the flag on", () => {
    flag("1");
    expect(ApasPage()).toBeTruthy();
  });
});
