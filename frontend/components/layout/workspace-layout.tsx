import type { ReactNode } from "react";
import { Shell } from "./shell";

/** Same shell inside .ws, which remaps the semantic tokens to the dark workspace palette. */
export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ws">
      <Shell width="wide">{children}</Shell>
    </div>
  );
}
