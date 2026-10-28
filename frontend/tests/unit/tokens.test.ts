import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(import.meta.dirname, "../../app/globals.css"), "utf8");

/** Returns the body of the first block whose header matches `header` exactly, using brace matching. */
function block(source: string, header: string): string {
  const start = source.indexOf(`${header} {`);
  if (start === -1) throw new Error(`block not found: ${header}`);
  let depth = 0;
  const open = source.indexOf("{", start);
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    if (depth === 0) return source.slice(open + 1, i);
  }
  throw new Error(`unterminated block: ${header}`);
}

function declarations(body: string): Array<[string, string]> {
  return [...body.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gm)].map((m) => [m[1]!, m[2]!.trim()]);
}

const DS_TOKENS = [
  "bg", "surface", "subtle", "border", "text", "text-2", "muted", "ocean", "ocean-hover", "ocean-soft",
  "amber", "amber-soft", "success", "error", "info",
  "ws-bg", "ws-surface", "ws-subtle", "ws-border", "ws-text", "ws-text-2", "ws-muted", "ws-ocean",
  "ws-ocean-soft", "ws-amber", "well", "on-ocean", "ws-on-ocean",
  "radius-tag", "radius-control", "radius-card", "radius-well",
  "pop-shadow", "pop-shadow-ws",
  "ease-out", "ease-drawer", "d-press", "d-micro", "d-ui", "d-sheet",
].map((n) => `--ds-${n}`);

// DS section 15, the names listed in the light :root block.
const SEMANTIC = [
  "background", "foreground", "card", "popover", "primary", "primary-foreground", "ring", "secondary", "muted",
  "muted-foreground", "accent", "border", "input", "destructive", "radius", "warning", "success", "info",
  "chart-1", "chart-2", "well",
].map((n) => `--${n}`);

const TYPE_UTILITIES = [
  "display", "h1", "h2", "h3", "h4", "body", "body-long", "small", "caption", "data", "code",
];

describe("globals.css tokens", () => {
  it("declares every --ds-* token exactly once, in :root", () => {
    const all = [...css.matchAll(/^\s*(--ds-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]!);
    for (const name of DS_TOKENS) {
      expect(all.filter((n) => n === name), name).toHaveLength(1);
    }
    expect(new Set(all).size).toBe(all.length);
    const inRoot = declarations(block(css, ":root")).map(([n]) => n);
    for (const name of all) expect(inRoot, name).toContain(name);
  });

  it("defines the shadcn semantic names from DS section 15 in :root", () => {
    const names = declarations(block(css, ":root")).map(([n]) => n);
    for (const name of SEMANTIC) expect(names, name).toContain(name);
  });

  it("keeps hex and rgb literals on --ds-* declarations only", () => {
    const stripped = css
      .split("\n")
      .filter((line) => !/^\s*--ds-[a-z0-9-]+\s*:/.test(line))
      .join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    expect(stripped).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(stripped).not.toMatch(/\brgba?\(/);
  });

  describe.each([
    [".ws block", () => block(css, ".ws")],
    ["dark media :root block", () => block(block(css, "@media (prefers-color-scheme: dark)"), ":root")],
  ])("%s", (_label, get) => {
    it("remaps by var() reference only, with no hex literals", () => {
      const body = get();
      expect(body).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      const decls = declarations(body);
      expect(decls.length).toBeGreaterThan(10);
      for (const [name, value] of decls) {
        expect(value, name).toMatch(/^var\(--ds-[a-z0-9-]+\)$/);
      }
    });

    it("remaps the same names the light :root defines", () => {
      const light = new Set(declarations(block(css, ":root")).map(([n]) => n));
      for (const [name] of declarations(get())) expect(light, name).toContain(name);
    });
  });

  it("sets color-scheme on :root and .ws", () => {
    expect(block(css, ":root")).toMatch(/color-scheme:\s*light dark/);
    expect(block(css, ".ws")).toMatch(/color-scheme:\s*dark/);
  });

  it.each(TYPE_UTILITIES)("defines the text-%s utility", (name) => {
    expect(css).toMatch(new RegExp(`@utility text-${name} \\{`));
  });
});
