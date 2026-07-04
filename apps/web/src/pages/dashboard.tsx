import { useQuery } from "@tanstack/react-query";
import type { Category } from "@mancave/shared";
import { FolderOpen, Package, Sparkles, Vault } from "lucide-react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [itemsRes, categoriesRes, wishlistRes] = await Promise.all([
        supabase.from("items").select("id", { count: "exact", head: true }),
        supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("items")
          .select("id", { count: "exact", head: true })
          .eq("status", "wishlist"),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (wishlistRes.error) throw wishlistRes.error;

      return {
        totalItems: itemsRes.count ?? 0,
        wishlistCount: wishlistRes.count ?? 0,
        categories: (categoriesRes.data ?? []) as Category[],
      };
    },
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: typeof Package;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          {loading ? (
            <Skeleton className="mb-1 h-7 w-14" />
          ) : (
            <p className="font-display text-2xl font-bold">{value ?? 0}</p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A bird's-eye view of everything in your vault."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total items"
          value={data?.totalItems}
          icon={Package}
          loading={isLoading}
        />
        <StatCard
          label="Categories"
          value={data?.categories.length}
          icon={FolderOpen}
          loading={isLoading}
        />
        <StatCard
          label="Wishlist"
          value={data?.wishlistCount}
          icon={Sparkles}
          loading={isLoading}
        />
      </div>

      {!isLoading && (data?.totalItems ?? 0) === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center"
        >
          <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary/12 ring-1 ring-primary/25">
            <Vault className="size-7 text-primary" />
          </span>
          <h2 className="font-display text-xl font-semibold">
            Your vault is empty — for now.
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Adding items arrives in Sprint 2. Your {data?.categories.length ?? 0}{" "}
            starter categories are already waiting on the Categories page.
          </p>
        </motion.div>
      )}
    </div>
  );
}
