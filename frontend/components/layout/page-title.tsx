/** The one <h1> per page: serif, h1 scale, with an optional one-line note under it. */
export function PageTitle({ children, note }: { children: string; note?: string }) {
  return (
    <div className="flex flex-col gap-2 py-8">
      <h1 className="text-h1 text-foreground">{children}</h1>
      {note ? <p className="text-body text-muted-foreground">{note}</p> : null}
    </div>
  );
}
