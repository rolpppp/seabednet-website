import { credits, joddDatasetCitation, joddLicenceLine } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-300 flex-col gap-1 px-4 py-6 text-caption text-muted-foreground">
        <p>
          {credits.jodd} {credits.joddPaper}
        </p>
        <p>{credits.joddSeg}</p>
        <p>{credits.backbones}</p>
        <p>Dataset licence: {joddLicenceLine}.</p>
        <p>{joddDatasetCitation}</p>
      </div>
    </footer>
  );
}
