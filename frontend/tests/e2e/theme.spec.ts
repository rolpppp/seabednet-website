import { expect, test } from "@playwright/test";

const token = (name: string) =>
  `(() => { const probe = document.createElement("div"); probe.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("${name}"); document.body.append(probe); const c = getComputedStyle(probe).backgroundColor; probe.remove(); return c; })()`;

async function surface(page: import("@playwright/test").Page, route: string) {
  await page.goto(route);
  // The shell's outermost element paints the surface; read the nearest non-transparent background from <main>.
  return page.evaluate(() => {
    let el: Element | null = document.querySelector("main");
    while (el) {
      const c = getComputedStyle(el).backgroundColor;
      if (c !== "rgba(0, 0, 0, 0)") return c;
      el = el.parentElement;
    }
    return "none";
  });
}

test.describe("theme", () => {
  test("dark OS: /results uses the workspace background token", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    const bg = await surface(page, "/results");
    await page.goto("/results");
    expect(bg).toBe(await page.evaluate(token("--ds-ws-bg")));
  });

  test("light OS: / uses the light background token", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    const bg = await surface(page, "/");
    await page.goto("/");
    expect(bg).toBe(await page.evaluate(token("--ds-bg")));
  });

  for (const scheme of ["light", "dark"] as const) {
    for (const route of ["/try", "/lab"]) {
      test(`${route} is workspace-dark with OS ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        const bg = await surface(page, route);
        await page.goto(route);
        expect(bg).toBe(await page.evaluate(token("--ds-ws-bg")));
      });
    }
  }
});
