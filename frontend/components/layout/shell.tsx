import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";

/** Shared page shell: nav, <main id="main"> and footer in a flex column. Internal to the two layouts. */
export function Shell({ children, width = "prose" }: { children: ReactNode; width?: "prose" | "wide" }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main id="main" className={cn("mx-auto w-full flex-1 px-4", width === "prose" ? "max-w-180" : "max-w-300")}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
