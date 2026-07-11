import {
  categoryBrandLabel,
  categoryShowsBrand,
  categoryShowsMoney,
  categoryShowsName,
  categoryShowsSeries,
  categoryShowsStatus,
  deriveItemName,
  withBooleanDefaults,
  type FieldDefinition,
} from "@mancave/shared";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { CategoryIcon } from "@/components/category-icon";
import { CustomFieldsInputs } from "@/components/custom-fields-inputs";
import { ImageUploader, type ExistingImage } from "@/components/image-uploader";
import { PageTransition } from "@/components/motion/page-transition";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import {
  useCreateItem,
  useItem,
  useUpdateItem,
  type ItemInput,
} from "@/hooks/use-items";
import { STATUS_LABELS } from "@/components/status-badge";

const CURRENCIES = ["CHF", "EUR", "USD", "GBP", "PKR", "JPY"];

/** Status choices offered in the form (legacy sold/gifted stay valid on old items). */
const STATUS_OPTIONS = ["owned", "wishlist"] as const;

const formSchema = z.object({
  category_id: z.string().min(1, "Pick a category"),
  // Required only for categories that show the Name field (checked on submit).
  name: z.string(),
  brand: z.string(),
  series: z.string(),
  description: z.string(),
  quantity: z.string().refine(
    (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0),
    "Must be a whole number",
  ),
  purchase_price: z.string().refine(
    (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
    "Must be a positive number",
  ),
  current_value: z.string().refine(
    (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
    "Must be a positive number",
  ),
  currency: z.string(),
  purchase_date: z.string(),
  status: z.enum(["owned", "wishlist", "sold", "gifted"]),
  condition: z.string(),
  location: z.string(),
  notes: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const EMPTY_VALUES: FormValues = {
  category_id: "",
  name: "",
  brand: "",
  series: "",
  description: "",
  quantity: "1",
  purchase_price: "",
  current_value: "",
  currency: "CHF",
  purchase_date: "",
  status: "owned",
  condition: "",
  location: "",
  notes: "",
};

function toItemInput(values: FormValues, customFields: Record<string, unknown>): ItemInput {
  return {
    category_id: values.category_id,
    name: values.name.trim(),
    brand: values.brand.trim() || null,
    series: values.series.trim() || null,
    description: values.description.trim() || null,
    quantity: values.quantity === "" ? 1 : Number(values.quantity),
    purchase_price: values.purchase_price === "" ? null : Number(values.purchase_price),
    current_value: values.current_value === "" ? null : Number(values.current_value),
    currency: values.currency,
    purchase_date: values.purchase_date || null,
    status: values.status,
    condition: values.condition || null,
    location: values.location.trim() || null,
    notes: values.notes.trim() || null,
    custom_fields: customFields,
  };
}

export function ItemFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: categories } = useCategories();
  const { data: existingItem, isLoading: itemLoading } = useItem(id);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const [files, setFiles] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<ExistingImage[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, unknown> | null>(null);

  const initialValues = useMemo<FormValues>(() => {
    if (!isEdit) {
      return { ...EMPTY_VALUES, category_id: searchParams.get("category") ?? "" };
    }
    if (!existingItem) return EMPTY_VALUES;
    return {
      category_id: existingItem.category_id,
      name: existingItem.name,
      brand: existingItem.brand ?? "",
      series: existingItem.series ?? "",
      description: existingItem.description ?? "",
      quantity: String(existingItem.quantity),
      purchase_price: existingItem.purchase_price?.toString() ?? "",
      current_value: existingItem.current_value?.toString() ?? "",
      currency: existingItem.currency,
      purchase_date: existingItem.purchase_date ?? "",
      status: existingItem.status,
      condition: existingItem.condition ?? "",
      location: existingItem.location ?? "",
      notes: existingItem.notes ?? "",
    };
  }, [isEdit, existingItem, searchParams]);

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    values: initialValues,
  });

  const selectedCategoryId = form.watch("category_id");
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const template = (selectedCategory?.field_template ?? []) as FieldDefinition[];
  const showMoney = categoryShowsMoney(selectedCategory?.slug);
  const showBrand = categoryShowsBrand(selectedCategory?.slug);
  const showSeries = categoryShowsSeries(selectedCategory?.slug);
  const showName = categoryShowsName(selectedCategory?.slug);
  const showStatus = categoryShowsStatus(selectedCategory?.slug);
  const brandLabel = categoryBrandLabel(selectedCategory?.slug);

  const effectiveCustomFields =
    customFields ?? (isEdit ? (existingItem?.custom_fields ?? {}) : {});

  // The tags editor was removed from the form; existing tags are preserved.
  const effectiveTags = isEdit ? (existingItem?.tags.map((t) => t.name) ?? []) : [];

  const visibleExisting = (existingItem?.image_urls ?? []).filter(
    (entry) => !removedImages.some((r) => r.image.id === entry.image.id),
  );

  const saving = createItem.isPending || updateItem.isPending;

  const onSubmit = async (values: FormValues) => {
    if (showName && !values.name.trim()) {
      form.setError("name", { message: "Give it a name" });
      return;
    }
    const finalCustomFields = withBooleanDefaults(template, effectiveCustomFields);
    // Hidden fields are cleared so stale values don't survive a shelf change.
    const brand = showBrand
      ? values.brand.trim() || (selectedCategory?.slug === "lego" ? "LEGO" : "")
      : "";
    const series = showSeries ? values.series : "";
    const name = showName
      ? values.name
      : deriveItemName(
          selectedCategory?.slug,
          finalCustomFields,
          selectedCategory?.name ?? "Item",
        );
    const input = toItemInput({ ...values, name, brand, series }, finalCustomFields);
    try {
      if (isEdit && id) {
        await updateItem.mutateAsync({
          id,
          input,
          tagNames: effectiveTags,
          newFiles: files,
          removedImages: removedImages.map((r) => r.image),
          existingCount: visibleExisting.length,
        });
        toast.success("Item updated");
        navigate(`/app/items/${id}`);
      } else {
        const newId = await createItem.mutateAsync({
          input,
          files,
          tagNames: effectiveTags,
        });
        toast.success("Added to your vault");
        navigate(`/app/items/${newId}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  if (isEdit && itemLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const errors = form.formState.errors;

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to={isEdit && id ? `/app/items/${id}` : "/app/collections"}>
            <ArrowLeft /> Back
          </Link>
        </Button>

        <PageHeader
          title={isEdit ? "Edit item" : "Add to the vault"}
          description={
            isEdit
              ? existingItem?.name
              : "Catalogue a new piece of your collection."
          }
        />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shelf</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories?.map((category) => {
                  const active = category.id === selectedCategoryId;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        form.setValue("category_id", category.id, {
                          shouldValidate: true,
                        });
                        setCustomFields({});
                        if (
                          category.slug === "lego" &&
                          !form.getValues("brand").trim()
                        ) {
                          form.setValue("brand", "LEGO");
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        !active &&
                          "border-border text-muted-foreground hover:text-foreground",
                      )}
                      style={
                        active
                          ? {
                              borderColor: category.color,
                              color: category.color,
                              backgroundColor: `color-mix(in oklab, ${category.color} 12%, transparent)`,
                            }
                          : undefined
                      }
                    >
                      <CategoryIcon
                        icon={category.icon}
                        color={category.color}
                        className="size-5 rounded-md"
                        iconClassName="size-3"
                      />
                      {category.name}
                    </button>
                  );
                })}
              </div>
              {errors.category_id && (
                <p className="mt-2 text-xs text-destructive">
                  {errors.category_id.message}
                </p>
              )}
            </CardContent>
          </Card>

          {selectedCategory && (
            <>
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                existing={visibleExisting}
                onRemoveExisting={(entry) =>
                  setRemovedImages((prev) => [...prev, entry])
                }
                files={files}
                onFilesChange={setFiles}
              />
            </CardContent>
          </Card>

          {(showName || showBrand || showSeries) && (
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {showName && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="LEGO McLaren Formula 1"
                      {...form.register("name")}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                )}

                {showBrand && (
                  <div className="space-y-2">
                    <Label htmlFor="brand">{brandLabel}</Label>
                    <Input
                      id="brand"
                      placeholder={brandLabel === "Studio" ? "Rockstar Games" : "LEGO"}
                      {...form.register("brand")}
                    />
                  </div>
                )}

                {showSeries && (
                  <div className="space-y-2">
                    <Label htmlFor="series">Series</Label>
                    <Input
                      id="series"
                      placeholder="Speed Champions"
                      {...form.register("series")}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {template.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedCategory?.name} details</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomFieldsInputs
                  template={template}
                  values={effectiveCustomFields}
                  onChange={setCustomFields}
                />
              </CardContent>
            </Card>
          )}

          {(showStatus || showMoney) && (
          <Card>
            <CardHeader>
              <CardTitle>Ownership</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {showStatus && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) =>
                      form.setValue("status", value as FormValues["status"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {STATUS_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showMoney && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase price</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="any"
                      min={0}
                      placeholder="0.00"
                      {...form.register("purchase_price")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current_value">Current value</Label>
                    <Input
                      id="current_value"
                      type="number"
                      step="any"
                      min={0}
                      placeholder="0.00"
                      {...form.register("current_value")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={form.watch("currency")}
                      onValueChange={(value) => form.setValue("currency", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="min-w-36">
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving
                ? files.length > 0
                  ? "Uploading photos…"
                  : "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Add to vault"}
            </Button>
          </div>
            </>
          )}
        </form>
      </div>
    </PageTransition>
  );
}
