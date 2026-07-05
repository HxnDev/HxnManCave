import {
  ImageOff,
  LayoutGrid,
  Library,
  Plus,
  Rows3,
  Search,
  Tag as TagIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CategoryIcon } from "@/components/category-icon";
import { PageTransition } from "@/components/motion/page-transition";
import { TiltCard } from "@/components/motion/tilt-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, STATUS_LABELS } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, type CategoryWithCount } from "@/hooks/use-categories";
import { useItems, type ItemSort, type ItemWithMeta } from "@/hooks/use-items";
import { useTags } from "@/hooks/use-tags";
import { cn } from "@/lib/utils";

const SORT_LABELS: Record<ItemSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name A–Z",
  value: "Most valuable",
};

/* ------------------------------------------------------------------ */
/* Shelf view — an actual wooden bookcase                              */
/* ------------------------------------------------------------------ */

function ShelfItem({ item, index }: { item: ItemWithMeta; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.5) }}
      className="shrink-0"
    >
      <Link
        to={`/app/items/${item.id}`}
        className="group relative block w-24 sm:w-32"
        title={item.name}
      >
        <div className="relative overflow-hidden rounded-md border border-black/40 bg-card shadow-[0_10px_16px_-6px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out group-hover:-translate-y-1.5">
          <div className="aspect-square overflow-hidden bg-muted">
            {item.cover_url ? (
              <img
                src={item.cover_url}
                alt={item.name}
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <div
                className="flex size-full items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 50% 40%, color-mix(in oklch, ${item.category.color} 16%, transparent), oklch(0.2 0.014 85))`,
                }}
              >
                <ImageOff className="size-6 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Name plate, revealed on hover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/85 to-black/0 p-1.5 pt-5 transition-transform duration-300 group-hover:translate-y-0">
            <p className="truncate text-[11px] font-medium text-white">
              {item.name}
            </p>
          </div>

          {item.status !== "owned" && (
            <div className="absolute top-1 right-1">
              <StatusBadge status={item.status} className="scale-75 backdrop-blur" />
            </div>
          )}
        </div>

        {/* Contact shadow on the shelf below */}
        <div className="mx-auto h-1.5 w-4/5 rounded-[50%] bg-black/55 blur-[4px] transition-all duration-300 group-hover:bg-black/30" />
      </Link>
    </motion.div>
  );
}

function Compartment({
  category,
  items,
}: {
  category: CategoryWithCount;
  items: ItemWithMeta[];
}) {
  return (
    <div>
      <div className="compartment flex items-end gap-4 overflow-x-auto px-4 pt-7 sm:gap-5 sm:px-5">
        {items.map((item, i) => (
          <ShelfItem key={item.id} item={item} index={i} />
        ))}

        {/* Empty slot to add to this shelf */}
        <Link
          to={`/app/items/new?category=${category.id}`}
          className="group mb-1.5 grid aspect-square w-24 shrink-0 place-items-center self-end rounded-md border border-dashed border-white/12 text-muted-foreground/60 transition-colors hover:border-primary/40 hover:text-primary sm:w-32"
          aria-label={`Add to ${category.name}`}
        >
          <Plus className="size-5 transition-transform group-hover:scale-125" />
        </Link>
      </div>

      {/* The shelf plank with its brass plaque */}
      <div className="relative">
        <div className="shelf-plank h-4 w-full" />
        <Link
          to={`/app/collections?category=${category.slug}`}
          className="brass-plaque absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[4px] px-2.5 py-px font-mono text-[9px] font-semibold tracking-[0.18em] whitespace-nowrap uppercase transition-transform hover:scale-105"
        >
          {category.name} · {items.length}
        </Link>
      </div>
    </div>
  );
}

function Bookcase({
  shelves,
}: {
  shelves: { category: CategoryWithCount; items: ItemWithMeta[] }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="wood-frame rounded-2xl p-2.5 sm:p-4"
    >
      <div className="bookcase-back overflow-hidden rounded-lg">
        {shelves.map((shelf) => (
          <Compartment
            key={shelf.category.id}
            category={shelf.category}
            items={shelf.items}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Grid view                                                           */
/* ------------------------------------------------------------------ */

function GridItem({ item, index }: { item: ItemWithMeta; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
    >
      <TiltCard>
        <Link
          to={`/app/items/${item.id}`}
          className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/35"
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
              <div
                className="flex size-full items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 50% 40%, color-mix(in oklch, ${item.category.color} 14%, transparent), transparent)`,
                }}
              >
                <ImageOff className="size-8 text-muted-foreground/50" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <StatusBadge status={item.status} className="backdrop-blur" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3">
            <CategoryIcon
              icon={item.category.icon}
              color={item.category.color}
              className="size-8 rounded-lg"
              iconClassName="size-4"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium group-hover:text-primary">
                {item.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[item.brand, item.series].filter(Boolean).join(" · ") ||
                  item.category.name}
              </p>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function CollectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const tagId = searchParams.get("tag") ?? "";
  const sort = (searchParams.get("sort") ?? "newest") as ItemSort;
  const view = searchParams.get("view") === "grid" ? "grid" : "shelf";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const selectedCategory = categories?.find((c) => c.slug === categorySlug);

  const { data: items, isLoading } = useItems({
    categoryId: selectedCategory?.id,
    status: status || undefined,
    tagId: tagId || undefined,
    search: search || undefined,
    sort,
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const shelves = (categories ?? [])
    .map((category) => ({
      category,
      items: (items ?? []).filter((item) => item.category_id === category.id),
    }))
    .filter((shelf) => shelf.items.length > 0);

  const hasActiveFilters = Boolean(categorySlug || status || tagId || search);

  return (
    <PageTransition>
      <PageHeader
        title="Collections"
        description="Every exhibit in your vault."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setParam("view", "")}
                className={cn(
                  "grid size-8 place-items-center rounded-md transition-colors",
                  view === "shelf"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Shelf view"
              >
                <Rows3 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setParam("view", "grid")}
                className={cn(
                  "grid size-8 place-items-center rounded-md transition-colors",
                  view === "grid"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
            <Button asChild>
              <Link
                to={`/app/items/new${selectedCategory ? `?category=${selectedCategory.id}` : ""}`}
              >
                <Plus /> Add item
              </Link>
            </Button>
          </div>
        }
      />

      {/* Search + sort */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, brand, series, notes…"
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(value) => setParam("sort", value === "newest" ? "" : value)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter chips */}
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParam("category", "")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              !categorySlug
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            All
          </button>
          {categories?.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                setParam("category", categorySlug === category.slug ? "" : category.slug)
              }
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                categorySlug === category.slug
                  ? "border-transparent"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              style={
                categorySlug === category.slug
                  ? {
                      backgroundColor: `color-mix(in oklch, ${category.color} 18%, transparent)`,
                      color: category.color,
                    }
                  : undefined
              }
            >
              {category.name}
              <span className="opacity-60">{category.item_count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["owned", "wishlist"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setParam("status", status === value ? "" : value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                status === value
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {STATUS_LABELS[value]}
            </button>
          ))}

          {(tags?.length ?? 0) > 0 && (
            <>
              <span className="mx-1 h-4 w-px bg-border" />
              {tags?.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setParam("tag", tagId === tag.id ? "" : tag.id)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors",
                    tagId === tag.id
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <TagIcon className="size-3" />
                  {tag.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {isLoading &&
        (view === "shelf" ? (
          <div className="wood-frame rounded-2xl p-2.5 sm:p-4">
            <div className="bookcase-back space-y-0 overflow-hidden rounded-lg">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="flex gap-5 px-5 pt-7 pb-1.5">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="size-24 rounded-md sm:size-32" />
                    ))}
                  </div>
                  <div className="shelf-plank h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ))}

      {!isLoading && (items?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <span className="glow-primary mb-4 grid size-14 place-items-center rounded-2xl bg-primary/12 ring-1 ring-primary/25">
            <Library className="size-7 text-primary" />
          </span>
          <h2 className="font-display text-xl font-semibold">
            {hasActiveFilters ? "Nothing matches" : "The shelves are empty"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try a different search or clear the filters."
              : "Add your first item and start filling the vault."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/app/items/new">
              <Plus /> Add your first item
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && view === "shelf" && shelves.length > 0 && (
        <Bookcase shelves={shelves} />
      )}

      {!isLoading && view === "grid" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items?.map((item, index) => (
            <GridItem key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
