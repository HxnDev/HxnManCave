import { ArrowRight, FolderOpen, Gem, ImageOff, Package, Plus, Sparkles, Vault } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { CategoryIcon } from "@/components/category-icon";
import { CategoryDonut, MonthlyAdditions } from "@/components/dashboard-charts";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { PageTransition } from "@/components/motion/page-transition";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories";
import { useItems, type ItemWithMeta } from "@/hooks/use-items";

function collectionValue(items: ItemWithMeta[]): { total: number; currency: string } | null {
  const owned = items.filter(
    (item) => item.status === "owned" && (item.current_value ?? item.purchase_price) !== null,
  );
  if (owned.length === 0) return null;

  const byCurrency = new Map<string, number>();
  for (const item of owned) {
    const value = (item.current_value ?? item.purchase_price ?? 0) * item.quantity;
    byCurrency.set(item.currency, (byCurrency.get(item.currency) ?? 0) + value);
  }
  const [currency, total] = [...byCurrency.entries()].sort((a, b) => b[1] - a[1])[0];
  return { total, currency };
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  format,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: typeof Package;
  loading: boolean;
  format?: (v: number) => string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-primary/8 blur-2xl" />
        <CardContent className="flex items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <Icon className="size-5" />
          </span>
          <div>
            {loading ? (
              <Skeleton className="mb-1 h-7 w-16" />
            ) : (
              <p className="font-display text-2xl font-bold">
                <AnimatedNumber value={value} format={format} />
              </p>
            )}
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardPage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: items, isLoading: itemsLoading } = useItems();

  const loading = categoriesLoading || itemsLoading;
  const totalItems = items?.length ?? 0;
  const wishlistCount = items?.filter((i) => i.status === "wishlist").length ?? 0;
  const value = items ? collectionValue(items) : null;
  const recent = items?.slice(0, 6) ?? [];
  const topCategories = [...(categories ?? [])]
    .sort((a, b) => b.item_count - a.item_count)
    .slice(0, 5)
    .filter((c) => c.item_count > 0);

  return (
    <PageTransition>
      <PageHeader
        title="Dashboard"
        description="A bird's-eye view of everything in your vault."
        actions={
          <Button asChild>
            <Link to="/app/items/new">
              <Plus /> Quick add
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total items" value={totalItems} icon={Package} loading={loading} />
        <StatCard
          label="Categories"
          value={categories?.length ?? 0}
          icon={FolderOpen}
          loading={loading}
          delay={0.05}
        />
        <StatCard
          label="Wishlist"
          value={wishlistCount}
          icon={Sparkles}
          loading={loading}
          delay={0.1}
        />
        <StatCard
          label={value ? `Value (${value.currency})` : "Collection value"}
          value={value?.total ?? 0}
          icon={Gem}
          loading={loading}
          format={(v) =>
            Math.round(v).toLocaleString("en-CH", { maximumFractionDigits: 0 })
          }
          delay={0.15}
        />
      </div>

      {!loading && totalItems === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center"
        >
          <span className="glow-primary mb-4 grid size-14 place-items-center rounded-2xl bg-primary/12 ring-1 ring-primary/25">
            <Vault className="size-7 text-primary" />
          </span>
          <h2 className="font-display text-xl font-semibold">
            Your vault is empty — for now.
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Add your first exhibit and watch this page come alive.
          </p>
          <Button asChild className="mt-6">
            <Link to="/app/items/new">
              <Plus /> Add your first item
            </Link>
          </Button>
        </motion.div>
      )}

      {!loading && totalItems > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-8 grid gap-4 lg:grid-cols-2"
        >
          <CategoryDonut categories={categories ?? []} />
          <MonthlyAdditions items={items ?? []} />
        </motion.section>
      )}

      {recent.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recently added</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/collections">
                View all <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {recent.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
              >
                <Link
                  to={`/app/items/${item.id}`}
                  className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/35"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ImageOff className="size-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5">
                      <StatusBadge status={item.status} className="scale-90 backdrop-blur" />
                    </div>
                  </div>
                  <p className="truncate p-2.5 text-xs font-medium group-hover:text-primary">
                    {item.name}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {topCategories.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Biggest shelves</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/categories">
                All categories <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="space-y-2.5">
            {topCategories.map((category, index) => {
              const share = totalItems > 0 ? category.item_count / totalItems : 0;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + index * 0.06 }}
                >
                  <Link
                    to={`/app/collections?category=${category.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/35"
                  >
                    <CategoryIcon
                      icon={category.icon}
                      color={category.color}
                      className="size-9 rounded-lg"
                      iconClassName="size-4"
                    />
                    <span className="w-32 truncate text-sm font-medium sm:w-40">
                      {category.name}
                    </span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <motion.span
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(share * 100, 2)}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + index * 0.06, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </span>
                    <span className="w-10 text-right font-display text-sm font-semibold tabular-nums">
                      {category.item_count}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </PageTransition>
  );
}
