import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { THEME_BOOTSTRAP, THEME_KEY } from "./preferences";
import { isSearchShortcut } from "./searchShortcut";

describe("appearance bootstrap", () => {
  it("applies a valid saved preference before hydration without interpreting stored code", () => {
    for (const [stored, expected] of [
      ["dark", "dark"],
      ["light", "light"],
      ["system", "system"],
      ["';throw Error('bad')", "system"],
      [null, "system"],
    ]) {
      const document = {
        documentElement: { dataset: {} as Record<string, string> },
      };
      runInNewContext(THEME_BOOTSTRAP, {
        document,
        localStorage: {
          getItem: (key: string) => {
            expect(key).toBe(THEME_KEY);
            return stored;
          },
        },
      });
      expect(document.documentElement.dataset.theme).toBe(expected);
    }
  });
  it("leaves the CSS device fallback intact when storage is blocked", () => {
    const document = { documentElement: { dataset: {} } };
    expect(() =>
      runInNewContext(THEME_BOOTSTRAP, {
        document,
        localStorage: {
          getItem() {
            throw new Error("blocked");
          },
        },
      }),
    ).not.toThrow();
    expect(document.documentElement.dataset).toEqual({});
  });
});

it("reserves only unhandled plain Cmd/Ctrl+K, outside IME composition/repeats", () => {
  const event = {
    key: "k",
    metaKey: false,
    ctrlKey: true,
    altKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
    defaultPrevented: false,
  };
  expect(isSearchShortcut(event)).toBe(true);
  expect(
    isSearchShortcut({ ...event, ctrlKey: false, metaKey: true, key: "K" }),
  ).toBe(true);
  for (const patch of [
    { ctrlKey: false },
    { key: "j" },
    { altKey: true },
    { shiftKey: true },
    { repeat: true },
    { isComposing: true },
    { defaultPrevented: true },
  ])
    expect(isSearchShortcut({ ...event, ...patch })).toBe(false);
});

it("keeps dark text and interactive foregrounds at readable contrast", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const dark = css.split(':root[data-theme="dark"] {')[1].split("}")[0];
  const values = Object.fromEntries(
    [...dark.matchAll(/(--[\w-]+):\s*#([a-f\d]{6})/g)].map((m) => [m[1], m[2]]),
  );
  const luminance = (hex: string) =>
    hex
      .match(/../g)!
      .map((c) => parseInt(c, 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((total, c, i) => total + c * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a: string, b: string) => {
    const x = luminance(values[a]),
      y = luminance(values[b]);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  for (const text of [
    "--text-primary",
    "--text-secondary",
    "--text-tertiary",
    "--accent",
    "--danger",
  ])
    for (const bg of ["--bg-canvas", "--bg-surface", "--bg-sunken"])
      expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5);
  for (const [text, bg] of [
    ["--success", "--success-soft"],
    ["--warning", "--warning-soft"],
    ["--accent", "--accent-soft"],
    ["--bg-surface", "--accent"],
  ])
    expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5);
});
