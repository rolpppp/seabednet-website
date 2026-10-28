import Link from "next/link";
import { PageTitle } from "@/components/layout/page-title";
import { ReadingLayout } from "@/components/layout/reading-layout";

export default function NotFound() {
  return (
    <ReadingLayout>
      <PageTitle note="That address does not exist on this site.">Page not found</PageTitle>
      <p className="text-body">
        <Link href="/" className="underline underline-offset-4">
          Back to the home page
        </Link>
      </p>
    </ReadingLayout>
  );
}
