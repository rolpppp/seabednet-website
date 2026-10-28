import type { ReactNode } from "react";
import { ReadingLayout } from "@/components/layout/reading-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <ReadingLayout>{children}</ReadingLayout>;
}
