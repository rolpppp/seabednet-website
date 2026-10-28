import Link from "next/link";
import { NAV_END_ITEMS, NAV_ITEMS, SITE_NAME } from "@/lib/site";
import { LensMark } from "./lens-mark";
import { NavLinks, NavMenu } from "./nav-links";

const gutter = "mx-auto flex w-full max-w-300 items-center gap-6 px-4";

export function SiteNav() {
  return (
    <header className="@container relative border-b border-border">
      <div className={gutter}>
        <Link href="/" className="inline-flex items-center gap-2 py-3 text-[15px] font-semibold text-foreground">
          <LensMark />
          {SITE_NAME}
        </Link>

        {/* Inline links from 760 px container width up; below that the same links sit in the menu. */}
        <nav aria-label="Primary" className="hidden flex-1 items-center justify-between @nav:flex">
          <NavLinks items={NAV_ITEMS} />
          <NavLinks items={NAV_END_ITEMS} />
        </nav>

        <NavMenu className="ml-auto @nav:hidden">
          <nav
            aria-label="Menu"
            className="absolute inset-x-0 top-full z-40 flex flex-col gap-2 border-b border-border bg-background px-4 py-3"
          >
            <NavLinks items={NAV_ITEMS} className="flex-col gap-0" />
            <NavLinks items={NAV_END_ITEMS} className="flex-col gap-0" />
          </nav>
        </NavMenu>
      </div>
    </header>
  );
}
