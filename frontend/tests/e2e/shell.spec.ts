import { expect, test } from "@playwright/test";
import { routes } from "./routes";

const NAV_PAGES = ["/", "/try", "/results", "/about", "/explore"];
const PAGES_WITH_H1 = [...NAV_PAGES, "/this-does-not-exist"];
const LABELS = ["Explore", "Try it", "Results", "About"];

test.describe("shell", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  for (const route of PAGES_WITH_H1) {
    test(`${route}: one h1, nav, footer`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);

      const nav = page.getByRole("navigation", { name: "Primary" });
      await expect(nav).toBeVisible();
      const header = page.locator("header");
      await expect(header.getByRole("link", { name: /SeaBed Lens/ })).toBeVisible();
      for (const label of LABELS) {
        await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
      }
      await expect(header.getByText("GitHub (link pending)").first()).toBeVisible();
      await expect(nav.getByRole("link", { name: "Thesis", exact: true })).toHaveAttribute("href", "/about");
      await expect(page.locator('header a[href="/lab"]')).toHaveCount(0);

      const footer = page.locator("footer");
      await expect(footer).toContainText("J-EDI Organism Detection Dataset (JODD)");
      await expect(footer).toContainText("JODD-Seg");
      await expect(footer).toContainText("ConvNeXt-T (ImageNet)");
      await expect(footer).toContainText("CC BY-NC-SA 4.0, JAMSTEC, scientific and educational use");
      await expect(footer).toContainText("10.1016/j.dib.2026.112462");
      await expect(footer).toContainText("10.17596/0004035");
    });
  }

  for (const route of NAV_PAGES) {
    test(`${route}: placeholder note`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText(/coming in feature \d{3}/)).toHaveCount(1);
    });
  }

  test("current item has aria-current and a 2 px underline", async ({ page }) => {
    await page.goto("/results");
    const nav = page.getByRole("navigation", { name: "Primary" });
    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText("Results");
    const width = await current.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.borderBottomWidth}|${s.textDecorationThickness}|${s.textDecorationLine}`;
    });
    expect(width.startsWith("2px")).toBe(true);
    await page.goto("/");
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(0);
  });

  test("/lab returns 200 and is not in the nav", async ({ page }) => {
    const response = await page.goto("/lab");
    expect(response?.status()).toBe(200);
  });

  test("the 404 route returns 404", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("GitHub is a placeholder with no href", async ({ page }) => {
    await page.goto("/");
    const gh = page.locator("header .ph", { hasText: "GitHub (link pending)" }).first();
    await expect(gh).toBeVisible();
    expect(await gh.evaluate((el) => el.closest("a"))).toBeNull();
    await expect(gh).not.toHaveAttribute("href", /.*/);
  });
});

test.describe("menu", () => {
  test("759 px: Menu visible, inline links hidden, menu shows the same links", async ({ page }) => {
    await page.setViewportSize({ width: 759, height: 800 });
    await page.goto("/");
    const menu = page.locator("header summary");
    await expect(menu).toBeVisible();
    await expect(menu).toHaveText("Menu");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
    await menu.click();
    for (const label of [...LABELS, "Thesis"]) {
      await expect(page.locator("header details").getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(page.locator("header details").getByText("GitHub (link pending)")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("header details")).not.toHaveAttribute("open", "");
    await expect(menu).toBeFocused();
  });

  test("761 px: inline links show and Menu is hidden", async ({ page }) => {
    await page.setViewportSize({ width: 761, height: 800 });
    await page.goto("/");
    await expect(page.locator("header summary")).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  });

  test.describe("JavaScript off", () => {
    test.use({ javaScriptEnabled: false, viewport: { width: 500, height: 800 } });
    test("links exist and the menu opens", async ({ page }) => {
      await page.goto("/results");
      const details = page.locator("header details");
      for (const label of [...LABELS, "Thesis"]) {
        await expect(details.locator("a", { hasText: label })).toHaveCount(1);
      }
      await page.locator("header summary").click();
      await expect(details.getByRole("link", { name: "Results", exact: true })).toBeVisible();
      await expect(page.locator("footer")).toContainText("JODD");
    });
  });
});

test.describe("320 px", () => {
  test.use({ viewport: { width: 320, height: 640 } });
  for (const route of routes) {
    test(`${route}: no horizontal scroll`, async ({ page }) => {
      await page.goto(route);
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(fits).toBe(true);
    });
  }
});
