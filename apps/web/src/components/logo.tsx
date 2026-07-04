import { Vault } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
        <Vault className="size-5 text-primary" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight">
          Man<span className="text-primary">Cave</span>
        </span>
      )}
    </div>
  );
}
