import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

// Reads .env.example only. Never opens any other .env* file.
const examplePath = path.resolve(import.meta.dirname, "../../../.env.example");
const lines = readFileSync(examplePath, "utf8").split("\n");
const assignments = new Map(
  lines
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)] as const;
    }),
);

describe(".env.example", () => {
  test("lists exactly the four documented names", () => {
    expect([...assignments.keys()].sort()).toEqual(
      ["API_BASE_URL", "SAMPLES_ENABLED", "SEABEDNET_REPO", "UPLOAD_RETENTION_HOURS"].sort(),
    );
  });

  test("SAMPLES_ENABLED is false", () => {
    expect(assignments.get("SAMPLES_ENABLED")).toBe("false");
  });

  test("UPLOAD_RETENTION_HOURS is blank and has a comment above it", () => {
    expect(assignments.get("UPLOAD_RETENTION_HOURS")).toBe("");
    const index = lines.findIndex((line) => line.startsWith("UPLOAD_RETENTION_HOURS="));
    expect(lines[index - 1]?.startsWith("#")).toBe(true);
  });
});
