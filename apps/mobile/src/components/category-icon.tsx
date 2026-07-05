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
} from "lucide-react-native";
import { View } from "react-native";
import { radius, tint, toRnColor } from "@/lib/theme";

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

export function CategoryIcon({
  icon,
  color,
  size = 44,
  iconSize,
}: {
  icon: string;
  color: string;
  size?: number;
  iconSize?: number;
}) {
  const Icon = CATEGORY_ICONS[icon] ?? Package;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: tint(color),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={iconSize ?? size * 0.48} color={toRnColor(color)} strokeWidth={2} />
    </View>
  );
}
