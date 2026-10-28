import { expect, test } from "@playwright/test";
import { routes } from "./routes";

test.describe("fonts and network", () => {
  for (const route of routes) {
    test(`${route}: everything comes from the app origin`, async ({ page, baseURL }) => {
      const origin = new URL(baseURL!).origin;
      const urls: string[] = [];
      page.on("request", (r) => urls.push(r.url()));
      await page.goto(route, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const foreign = urls.filter((u) => !u.startsWith("data:") && !u.startsWith("blob:") && new URL(u).origin !== origin);
      expect(foreign).toEqual([]);
      for (const u of urls.filter((u) => u.endsWith(".woff2"))) {
        expect(new URL(u).pathname.startsWith("/_next/static/media/")).toBe(true);
      }
    });
  }

  test("computed families resolve to Inter, Source Serif 4 and JetBrains Mono, all loaded", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // JetBrains Mono has no consumer yet, so force a use of it to make the browser load it.
    const result = await page.evaluate(async () => {
      const probe = document.createElement("code");
      probe.className = "text-code";
      probe.textContent = "x";
      document.body.append(probe);
      await document.fonts.ready;
      const family = (el: Element) => getComputedStyle(el).fontFamily;
      const out = {
        body: family(document.body),
        h1: family(document.querySelector("h1")!),
        code: family(probe),
        loaded: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family),
      };
      probe.remove();
      return out;
    });
    expect(result.body).toMatch(/inter/i);
    expect(result.h1).toMatch(/source[ _]serif[ _]4/i);
    expect(result.code).toMatch(/jetbrains[ _]mono/i);
    expect(result.loaded.some((f) => /inter/i.test(f))).toBe(true);
    expect(result.loaded.some((f) => /source[ _]serif[ _]4/i.test(f))).toBe(true);
    expect(result.loaded.some((f) => /jetbrains[ _]mono/i.test(f))).toBe(true);
  });

  test("blocking the woff2 files keeps the layout stable", async ({ page }) => {
    const measure = () =>
      page.evaluate(() => ({
        scrollWidth: document.body.scrollWidth,
        h1: document.querySelector("h1")!.getBoundingClientRect().height,
      }));

    await page.goto("/results", { waitUntil: "networkidle" });
    const loaded = await measure();

    await page.route("**/*.woff2", (route) => route.abort());
    await page.goto("/results", { waitUntil: "load" });
    const blocked = await measure();

    expect(blocked.scrollWidth).toBe(loaded.scrollWidth);
    expect(Math.abs(blocked.h1 - loaded.h1)).toBeLessThanOrEqual(4);
  });
});
