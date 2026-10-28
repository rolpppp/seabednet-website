import { describe, expect, it } from "vitest";
import { isActive } from "@/lib/nav";

describe("isActive", () => {
  it("matches / only on exactly /", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/results", "/")).toBe(false);
    expect(isActive("/try", "/")).toBe(false);
  });

  it("matches other items by prefix on a path segment", () => {
    expect(isActive("/results", "/results")).toBe(true);
    expect(isActive("/results/x", "/results")).toBe(true);
    expect(isActive("/resultsx", "/results")).toBe(false);
    expect(isActive("/about", "/results")).toBe(false);
  });
});
