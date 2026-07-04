import { useQuery } from "@tanstack/react-query";
import type { Category } from "@mancave/shared";
import {
  Blocks,
  BookOpen,
  Cpu,
  Gamepad2,
  Gift,
  KeyRound,
  LampDesk,
  Package,
  PersonStanding,
  Spade,
  SprayCan,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

const iconMap: Record<string, LucideIcon> = {
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
};

interface CategoryWithCount extends Category {
  item_count: number;
}

function useCategories() {
  return useQuery({
    queryKey: ["categories-with-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, items(count)")
        .order("sort_order", { ascending: true });
      if (error) throw error;

      return (data ?? []).map((row) => {
        const { items, ...category } = row as Category & {
          items: { count: number }[];
        };
        return {
          ...category,
          item_count: items[0]?.count ?? 0,
        } satisfies CategoryWithCount;
      });
    },
  });
}

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();

  return (
    <div>
      <PageHeader
        title="Categories"
        description="The shelves of your vault. Custom categories arrive in Sprint 2."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}

        {categories?.map((category, index) => {
          const Icon = iconMap[category.icon] ?? Package;
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
            >
              <Card className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="flex items-center gap-4">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${category.color} 15%, transparent)`,
                      color: category.color,
                    }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{category.name}</p>
                    <Badge variant="secondary" className="mt-1">
                      {category.item_count}{" "}
                      {category.item_count === 1 ? "item" : "items"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
