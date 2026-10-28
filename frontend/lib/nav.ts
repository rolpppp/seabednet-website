/** True when `href` is the current section: exact for "/", path-segment prefix for everything else. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
