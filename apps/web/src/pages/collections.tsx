import { Library } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export function CollectionsPage() {
  return (
    <div>
      <PageHeader
        title="Collections"
        description="Browse, filter and search every item you own."
      />

      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary/12 ring-1 ring-primary/25">
          <Library className="size-7 text-primary" />
        </span>
        <h2 className="font-display text-xl font-semibold">Coming in Sprint 2</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Card, list and table views of your entire inventory — with photos,
          filters and instant search.
        </p>
      </div>
    </div>
  );
}
