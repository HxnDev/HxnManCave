import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  owned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  wishlist: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  sold: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  gifted: "bg-sky-500/15 text-sky-400 border-sky-500/25",
};

export const STATUS_LABELS: Record<string, string> = {
  owned: "Owned",
  wishlist: "Wishlist",
  sold: "Sold",
  gifted: "Gifted",
};

export const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  used: "Used",
  sealed: "Sealed",
  damaged: "Damaged",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_STYLES[status] ?? STATUS_STYLES.owned, className)}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
