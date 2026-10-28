"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { isActive } from "@/lib/nav";
import type { NavItem } from "@/lib/site";

const linkClass =
  "inline-flex items-center border-b-2 border-transparent py-2 text-small text-muted-foreground";
const currentClass = "border-primary text-foreground";

/** A list of nav links. The current page gets aria-current and a 2 px underline; items without an href are placeholders. */
export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <ul className={cn("flex gap-6", className)}>
      {items.map((item) => {
        if (item.href === null) {
          return (
            <li key={item.label}>
              <span className={cn(linkClass, "ph")}>{item.label}</span>
            </li>
          );
        }
        const current = isActive(pathname, item.href);
        return (
          <li key={item.label}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={cn(linkClass, current && currentClass)}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Native <details> menu: works without JavaScript; this adds close-on-navigation and Esc. */
export function NavMenu({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  return (
    <details
      ref={ref}
      className={className}
      onKeyDown={(event) => {
        const details = ref.current;
        if (event.key === "Escape" && details?.open) {
          details.open = false;
          details.querySelector("summary")?.focus();
        }
      }}
    >
      <summary className="inline-flex cursor-pointer items-center py-2 text-small marker:content-none">Menu</summary>
      {children}
    </details>
  );
}
