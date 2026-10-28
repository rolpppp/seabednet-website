/** Wordmark glyph: a ring with a small amber dot (DS 9.13). Decorative. */
export function LensMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" className={className}>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="7" r="2" className="fill-amber" />
    </svg>
  );
}
