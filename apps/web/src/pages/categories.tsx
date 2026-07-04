import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { CategoryDialog } from "@/components/category-dialog";
import { CategoryIcon } from "@/components/category-icon";
import { PageTransition } from "@/components/motion/page-transition";
import { TiltCard } from "@/components/motion/tilt-card";
import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategories,
  useDeleteCategory,
  type CategoryWithCount,
} from "@/hooks/use-categories";

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryWithCount | null>(null);
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCategory.mutateAsync(deleting.id);
      toast.success(`"${deleting.name}" removed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Categories"
        description="The shelves of your vault."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus /> New category
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}

        {categories?.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
          >
            <TiltCard maxTilt={4}>
              <div
                className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/35"
                style={{
                  background: `radial-gradient(ellipse 90% 90% at 15% 0%, color-mix(in oklch, ${category.color} 9%, transparent), var(--card))`,
                }}
              >
                <Link
                  to={`/app/collections?category=${category.slug}`}
                  className="flex items-center gap-4 p-5"
                >
                  <CategoryIcon
                    icon={category.icon}
                    color={category.color}
                    className="transition-transform group-hover:scale-110"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold">
                      {category.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {category.item_count}{" "}
                      {category.item_count === 1 ? "item" : "items"}
                    </p>
                  </div>
                </Link>

                <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(category);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleting(category)}
                      >
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.item_count
                ? `This shelf still holds ${deleting.item_count} item(s) — move or delete them first.`
                : "This shelf is empty and will be removed permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={Boolean(deleting?.item_count)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
