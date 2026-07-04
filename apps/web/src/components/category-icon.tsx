import {
  Blocks,
  BookOpen,
  Box,
  Car,
  Coins,
  Cpu,
  Disc3,
  Dumbbell,
  Gamepad2,
  Gem,
  Gift,
  Guitar,
  Headphones,
  KeyRound,
  LampDesk,
  Package,
  PersonStanding,
  Plane,
  Shirt,
  Spade,
  SprayCan,
  Sword,
  Watch,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  blocks: Blocks,
  "person-standing": PersonStanding,
  "book-open": BookOpen,
  "lamp-desk": LampDesk,
  gift: Gift,
  "key-round": KeyRound,
  "spray-can": SprayCan,
  spade: Spade,
  "gamepad-2": Gamepad2,
  cpu: Cpu,
  package: Package,
  box: Box,
  watch: Watch,
  gem: Gem,
  coins: Coins,
  "disc-3": Disc3,
  headphones: Headphones,
  guitar: Guitar,
  shirt: Shirt,
  sword: Sword,
  car: Car,
  plane: Plane,
  wine: Wine,
  dumbbell: Dumbbell,
};

export const COLOR_OPTIONS = [
  "oklch(0.63 0.22 25)",
  "oklch(0.68 0.15 45)",
  "oklch(0.78 0.14 75)",
  "oklch(0.72 0.13 140)",
  "oklch(0.7 0.12 195)",
  "oklch(0.7 0.11 230)",
  "oklch(0.66 0.16 260)",
  "oklch(0.67 0.24 295)",
  "oklch(0.65 0.17 300)",
  "oklch(0.62 0.19 350)",
  "oklch(0.63 0.2 15)",
  "oklch(0.64 0.015 80)",
];

export function CategoryIcon({
  icon,
  color,
  className,
  iconClassName,
}: {
  icon: string;
  color: string;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = CATEGORY_ICONS[icon] ?? Package;
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)`,
        color,
      }}
    >
      <Icon className={cn("size-5", iconClassName)} />
    </span>
  );
}
