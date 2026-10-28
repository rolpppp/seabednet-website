import path from "node:path";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// The single .env lives at the repo root, one level above frontend/.
loadEnvConfig(path.resolve(process.cwd(), ".."));

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  env: {
    API_BASE_URL: process.env.API_BASE_URL ?? "",
    SAMPLES_ENABLED: process.env.SAMPLES_ENABLED ?? "false",
  },
  pageExtensions: isProduction
    ? ["tsx", "ts", "jsx", "js"]
    : ["tsx", "ts", "jsx", "js", "dev.tsx"],
};

export default nextConfig;
