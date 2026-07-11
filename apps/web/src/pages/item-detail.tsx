import {
  categoryShowsBrand,
  categoryShowsMoney,
  categoryShowsSeries,
  type FieldDefinition,
} from "@mancave/shared";
import {
  ArrowLeft,
  ImageOff,
  Pencil,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { PageTransition } from "@/components/motion/page-transition";
import { StatusBadge } from "@/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteItem, useItem } from "@/hooks/use-items";
import { cn } from "@/lib/utils";

function formatMoney(value: number | null, currency: string) {
  if (value === null) return null;
  return new Intl.NumberFormat("en-CH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatFieldValue(field: FieldDefinition, value: unknown): string {
  if (field.type === "boolean") return value ? "Yes" : "No";
  const text = String(value);
  return field.unit ? `${text} ${field.unit}` : text;
}

export function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading } = useItem(id);
  const deleteItem = useDeleteItem();
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading || !item) {
    return (
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  const template = (item.category.field_template ?? []) as FieldDefinition[];
  const customEntries = template
    .filter((field) => item.custom_fields[field.key] !== undefined)
    .map((field) => ({
      label: field.label,
      value: formatFieldValue(field, item.custom_fields[field.key]),
    }));

  const gallery = item.image_urls;
  const active = gallery[activeImage] ?? gallery[0];

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(item);
      toast.success(`"${item.name}" removed from the vault`);
      navigate("/app/collections");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/app/collections">
              <ArrowLeft /> Collections
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/app/items/${item.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the item and its photos permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleDelete()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <motion.div
              key={active?.image.id ?? "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card"
            >
              {active ? (
                <img
                  src={active.url}
                  alt={item.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageOff className="size-10" />
                  <span className="text-sm">No photos yet</span>
                </div>
              )}
            </motion.div>

            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((entry, i) => (
                  <button
                    key={entry.image.id}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "size-16 shrink-0 overflow-hidden rounded-lg border transition-all",
                      i === activeImage
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border opacity-60 hover:opacity-100",
                    )}
                  >
                    <img src={entry.url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <CategoryIcon
                icon={item.category.icon}
                color={item.category.color}
                className="size-7 rounded-lg"
                iconClassName="size-3.5"
              />
              <span className="text-sm text-muted-foreground">
                {item.category.name}
              </span>
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight">
              {item.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              {item.tags.map((tag) => (
                <Link key={tag.id} to={`/app/collections?tag=${tag.id}`}>
                  <Badge
                    variant="outline"
                    className="gap-1 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <TagIcon className="size-3" />
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            {(() => {
              const parts = [
                categoryShowsBrand(item.category.slug) ? item.brand : null,
                categoryShowsSeries(item.category.slug) ? item.series : null,
              ].filter(Boolean);
              return parts.length > 0 ? (
                <p className="mt-3 text-muted-foreground">{parts.join(" · ")}</p>
              ) : null;
            })()}

            {item.description && (
              <p className="mt-4 text-sm leading-relaxed">{item.description}</p>
            )}

            {categoryShowsMoney(item.category.slug) &&
              (item.purchase_price !== null || item.current_value !== null) && (
                <Card className="mt-6">
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    {item.purchase_price !== null && (
                      <div>
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-display text-lg font-semibold">
                          {formatMoney(item.purchase_price, item.currency)}
                        </p>
                      </div>
                    )}
                    {item.current_value !== null && (
                      <div>
                        <p className="text-muted-foreground">Worth now</p>
                        <p className="font-display text-lg font-semibold text-primary">
                          {formatMoney(item.current_value, item.currency)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            {customEntries.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm text-muted-foreground">
                    {item.category.name} details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {customEntries.map((entry) => (
                      <div key={entry.label}>
                        <dt className="text-muted-foreground">{entry.label}</dt>
                        <dd className="font-medium">{entry.value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
