import type { Category, Item, ItemImage, Tag } from "@mancave/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteStorageFiles,
  getSignedUrls,
  uploadItemImage,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { syncItemTags } from "./use-tags";

export type CategorySummary = Pick<
  Category,
  "id" | "name" | "slug" | "icon" | "color" | "field_template"
>;

export interface ItemWithMeta extends Item {
  category: CategorySummary;
  images: ItemImage[];
  tags: Tag[];
  /** Signed URL of the cover image, if any. */
  cover_url: string | null;
}

export interface ItemDetail extends ItemWithMeta {
  /** All images with signed URLs, cover first. */
  image_urls: { image: ItemImage; url: string; thumb_url: string }[];
}

const ITEM_SELECT =
  "*, category:categories(id, name, slug, icon, color, field_template), images:item_images(*), item_tags(tag:tags(id, user_id, name, created_at))";

type ItemRow = Item & {
  category: CategorySummary;
  images: ItemImage[];
  item_tags: { tag: Tag }[];
};

function normalizeRow(row: ItemRow): Omit<ItemWithMeta, "cover_url"> {
  const { item_tags, images, ...item } = row;
  return {
    ...item,
    images: [...images].sort((a, b) =>
      a.is_main === b.is_main ? a.sort_order - b.sort_order : a.is_main ? -1 : 1,
    ),
    tags: item_tags.map((entry) => entry.tag).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export type ItemSort = "newest" | "oldest" | "name" | "value";

export interface ItemFilters {
  categoryId?: string;
  status?: string;
  tagId?: string;
  search?: string;
  sort?: ItemSort;
}

export function useItems(filters: ItemFilters = {}) {
  return useQuery({
    queryKey: ["items", filters],
    queryFn: async (): Promise<ItemWithMeta[]> => {
      let query = supabase.from("items").select(ITEM_SELECT);

      if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
      if (filters.status) query = query.eq("status", filters.status);

      if (filters.search) {
        const q = filters.search.replace(/[,%()]/g, " ").trim();
        if (q) {
          query = query.or(
            `name.ilike.%${q}%,brand.ilike.%${q}%,series.ilike.%${q}%,notes.ilike.%${q}%,description.ilike.%${q}%`,
          );
        }
      }

      switch (filters.sort ?? "newest") {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "name":
          query = query.order("name", { ascending: true });
          break;
        case "value":
          query = query
            .order("current_value", { ascending: false, nullsFirst: false })
            .order("purchase_price", { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let rows = ((data ?? []) as unknown as ItemRow[]).map(normalizeRow);

      if (filters.tagId) {
        rows = rows.filter((row) => row.tags.some((tag) => tag.id === filters.tagId));
      }

      // Lists always use the small thumbnail; legacy rows without one fall
      // back to the full image until the migration script backfills them.
      const coverPathOf = (images: ItemImage[]): string | null =>
        images[0] ? (images[0].thumb_path ?? images[0].storage_path) : null;

      const coverPaths = rows
        .map((row) => coverPathOf(row.images))
        .filter((p): p is string => Boolean(p));
      const urlMap = await getSignedUrls(coverPaths);

      return rows.map((row) => {
        const coverPath = coverPathOf(row.images);
        return {
          ...row,
          cover_url: coverPath ? (urlMap.get(coverPath) ?? null) : null,
        };
      });
    },
  });
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: ["item", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<ItemDetail> => {
      const { data, error } = await supabase
        .from("items")
        .select(ITEM_SELECT)
        .eq("id", id!)
        .single();
      if (error) throw error;

      const row = normalizeRow(data as unknown as ItemRow);
      const urlMap = await getSignedUrls(
        row.images.flatMap((img) =>
          img.thumb_path ? [img.storage_path, img.thumb_path] : [img.storage_path],
        ),
      );

      const image_urls = row.images
        .map((image) => {
          const url = urlMap.get(image.storage_path);
          return {
            image,
            url,
            thumb_url: urlMap.get(image.thumb_path ?? image.storage_path) ?? url,
          };
        })
        .filter(
          (entry): entry is { image: ItemImage; url: string; thumb_url: string } =>
            Boolean(entry.url),
        );

      return {
        ...row,
        cover_url: image_urls[0]?.url ?? null,
        image_urls,
      };
    },
  });
}

export interface ItemInput {
  category_id: string;
  name: string;
  brand: string | null;
  series: string | null;
  description: string | null;
  quantity: number;
  purchase_price: number | null;
  current_value: number | null;
  currency: string;
  purchase_date: string | null;
  status: string;
  condition: string | null;
  location: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
}

async function uploadImages(userId: string, itemId: string, files: File[], startOrder: number) {
  for (let i = 0; i < files.length; i++) {
    const { displayPath, thumbPath } = await uploadItemImage(userId, itemId, files[i]);
    const { error } = await supabase.from("item_images").insert({
      item_id: itemId,
      user_id: userId,
      storage_path: displayPath,
      thumb_path: thumbPath,
      sort_order: startOrder + i,
      is_main: startOrder + i === 0,
    });
    if (error) throw error;
  }
}

function invalidateItemQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  itemId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ["items"] });
  void queryClient.invalidateQueries({ queryKey: ["categories"] });
  void queryClient.invalidateQueries({ queryKey: ["tags"] });
  if (itemId) void queryClient.invalidateQueries({ queryKey: ["item", itemId] });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      files,
      tagNames,
    }: {
      input: ItemInput;
      files: File[];
      tagNames: string[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const { data, error } = await supabase
        .from("items")
        .insert({ ...input, user_id: userData.user.id })
        .select("id")
        .single();
      if (error) throw error;

      const itemId = (data as { id: string }).id;
      await syncItemTags(userData.user.id, itemId, tagNames);
      await uploadImages(userData.user.id, itemId, files, 0);
      return itemId;
    },
    onSuccess: () => invalidateItemQueries(queryClient),
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
      tagNames,
      newFiles,
      removedImages,
      existingCount,
    }: {
      id: string;
      input: ItemInput;
      tagNames: string[];
      newFiles: File[];
      removedImages: ItemImage[];
      existingCount: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const { error } = await supabase.from("items").update(input).eq("id", id);
      if (error) throw error;

      await syncItemTags(userData.user.id, id, tagNames);

      if (removedImages.length > 0) {
        const { error: imgError } = await supabase
          .from("item_images")
          .delete()
          .in(
            "id",
            removedImages.map((img) => img.id),
          );
        if (imgError) throw imgError;
        await deleteStorageFiles(
          removedImages.flatMap((img) =>
            img.thumb_path ? [img.storage_path, img.thumb_path] : [img.storage_path],
          ),
        );
      }

      await uploadImages(userData.user.id, id, newFiles, existingCount);
      return id;
    },
    onSuccess: (id) => invalidateItemQueries(queryClient, id),
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ItemWithMeta | ItemDetail) => {
      // Remove storage files first; DB rows cascade with the item.
      await deleteStorageFiles(
        item.images.flatMap((img) =>
          img.thumb_path ? [img.storage_path, img.thumb_path] : [img.storage_path],
        ),
      );
      const { error } = await supabase.from("items").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => invalidateItemQueries(queryClient),
  });
}
