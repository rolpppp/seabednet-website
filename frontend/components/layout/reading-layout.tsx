import type { ReactNode } from "react";
import { Shell } from "./shell";

export function ReadingLayout({ children, width = "prose" }: { children: ReactNode; width?: "prose" | "wide" }) {
  return <Shell width={width}>{children}</Shell>;
}
