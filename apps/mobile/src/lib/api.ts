import type { Category, Item, ItemImage } from "@mancave/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { supabase } from "./supabase";

const BUCKET = "item-images";

export type CategorySummary = Pick<
  Category,
  "id" | "name" | "slug" | "icon" | "color" | "field_template"
>;

export interface MobileItem extends Item {
  category: CategorySummary;
  images: ItemImage[];
  cover_url: string | null;
}

const ITEM_SELECT =
  "*, category:categories(id, name, slug, icon, color, field_template), images:item_images(*)";

function sortImages(images: ItemImage[]): ItemImage[] {
  return [...images].sort((a, b) =>
    a.is_main === b.is_main ? a.sort_order - b.sort_order : a.is_main ? -1 : 1,
  );
}

async function getSignedUrls(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 3600);
  if (error) throw error;
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) map.set(entry.path, entry.signedUrl);
  }
  return map;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: async (): Promise<MobileItem[]> => {
      const { data, error } = await supabase
        .from("items")
        .select(ITEM_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as unknown as (Item & {
        category: CategorySummary;
        images: ItemImage[];
      })[];

      const withSortedImages = rows.map((row) => ({
        ...row,
        images: sortImages(row.images),
      }));

      const coverPaths = withSortedImages
        .map((row) => row.images[0]?.storage_path)
        .filter((p): p is string => Boolean(p));
      const urlMap = await getSignedUrls(coverPaths);

      return withSortedImages.map((row) => {
        const cover = row.images[0]?.storage_path;
        return { ...row, cover_url: cover ? (urlMap.get(cover) ?? null) : null };
      });
    },
  });
}

export function useItemImages(item: MobileItem | undefined) {
  return useQuery({
    queryKey: ["item-images", item?.id],
    enabled: Boolean(item && item.images.length > 0),
    queryFn: async (): Promise<string[]> => {
      const urlMap = await getSignedUrls(
        item!.images.map((img) => img.storage_path),
      );
      return item!.images
        .map((img) => urlMap.get(img.storage_path))
        .filter((url): url is string => Boolean(url));
    },
  });
}

/** Resize + compress a picked photo, then upload it to storage. */
async function uploadPhoto(
  userId: string,
  itemId: string,
  uri: string,
  sortOrder: number,
): Promise<void> {
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.7, format: SaveFormat.JPEG },
  );

  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const path = `${userId}/${itemId}/${Date.now()}-${sortOrder}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(base64), { contentType: "image/jpeg" });
  if (error) throw error;

  const { error: rowError } = await supabase.from("item_images").insert({
    item_id: itemId,
    user_id: userId,
    storage_path: path,
    sort_order: sortOrder,
    is_main: sortOrder === 0,
  });
  if (rowError) throw rowError;
}

export interface QuickItemInput {
  category_id: string;
  name: string;
  brand: string | null;
  status: string;
  purchase_price: number | null;
  currency: string;
  notes: string | null;
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      photoUris,
    }: {
      input: QuickItemInput;
      photoUris: string[];
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
      for (let i = 0; i < photoUris.length; i++) {
        await uploadPhoto(userData.user.id, itemId, photoUris[i], i);
      }
      return itemId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: MobileItem) => {
      if (item.images.length > 0) {
        await supabase.storage
          .from(BUCKET)
          .remove(item.images.map((img) => img.storage_path));
      }
      const { error } = await supabase.from("items").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
