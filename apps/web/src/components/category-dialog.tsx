import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CATEGORY_ICONS, COLOR_OPTIONS } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateCategory,
  useUpdateCategory,
  type CategoryWithCount,
} from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits instead of creates. */
  category?: CategoryWithCount | null;
}) {
  const isEdit = Boolean(category);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("package");
  const [color, setColor] = useState(COLOR_OPTIONS[3]);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const saving = createCategory.isPending || updateCategory.isPending;

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setIcon(category?.icon ?? "package");
      setColor(category?.color ?? COLOR_OPTIONS[7]);
    }
  }, [open, category]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Give the category a name");
      return;
    }
    try {
      if (isEdit && category) {
        await updateCategory.mutateAsync({ id: category.id, name: name.trim(), icon, color });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync({
          name: name.trim(),
          slug: slugify(name),
          icon,
          color,
          field_template: [],
        });
        toast.success(`"${name.trim()}" shelf added`);
      }
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("duplicate")
          ? "A category with this name already exists"
          : error instanceof Error
            ? error.message
            : "Something went wrong";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Rename or restyle this shelf."
              : "Add a new shelf to your vault."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              placeholder="Vinyl Records"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg border transition-colors",
                    icon === key
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                  aria-label={key}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={cn(
                    "size-8 rounded-full transition-transform",
                    color === option
                      ? "scale-110 ring-2 ring-foreground/60 ring-offset-2 ring-offset-background"
                      : "hover:scale-105",
                  )}
                  style={{ backgroundColor: option }}
                  aria-label={option}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
