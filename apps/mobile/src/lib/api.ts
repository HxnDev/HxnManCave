import type { Category, Item, ItemImage, Profile } from "@mancave/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
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
  /** Storage path behind cover_url — stable cache key for expo-image. */
  cover_path: string | null;
}

const ITEM_SELECT =
  "*, category:categories(id, name, slug, icon, color, field_template), images:item_images(*)";

function sortImages(images: ItemImage[]): ItemImage[] {
  return [...images].sort((a, b) =>
    a.is_main === b.is_main ? a.sort_order - b.sort_order : a.is_main ? -1 : 1,
  );
}

/** Sign for 7 days; refresh via the memo an hour before expiry. */
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * path -> signed URL memo. Keeping URLs stable across refetches is what makes
 * the image cache work — a fresh token per fetch would look like a new image.
 */
const signedUrlMemo = new Map<string, { url: string; expiresAt: number }>();

async function getSignedUrls(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;

  const now = Date.now();
  const missing: string[] = [];
  for (const path of paths) {
    const hit = signedUrlMemo.get(path);
    if (hit && hit.expiresAt > now) map.set(path, hit.url);
    else missing.push(path);
  }
  if (missing.length === 0) return map;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(missing, SIGN_TTL_SECONDS);
  if (error) throw error;
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) {
      signedUrlMemo.set(entry.path, {
        url: entry.signedUrl,
        expiresAt: now + (SIGN_TTL_SECONDS - 3600) * 1000,
      });
      map.set(entry.path, entry.signedUrl);
    }
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

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "category"
  );
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const { error } = await supabase.from("categories").insert({
        ...input,
        slug: slugify(input.name),
        field_template: [],
        user_id: userData.user.id,
        sort_order: 100,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CategoryInput & { id: string }) => {
      const { error } = await supabase
        .from("categories")
        .update(input)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        if (error.code === "23503") {
          throw new Error(
            "This category still has items. Move or delete them first.",
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

/** Resolve an avatar to a displayable URL (http URL from OAuth, or storage path). */
export function useAvatarUrl(profile: Profile | null | undefined) {
  return useQuery({
    queryKey: ["avatar-url", profile?.avatar_url],
    enabled: Boolean(profile?.avatar_url),
    queryFn: async (): Promise<string | null> => {
      const raw = profile!.avatar_url!;
      if (raw.startsWith("http")) return raw;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(raw, 3600);
      if (error) return null;
      return data.signedUrl;
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uri: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const manipulated = await manipulateAsync(
        uri,
        [{ resize: { width: 512 } }],
        { compress: 0.8, format: SaveFormat.JPEG },
      );

      const fileBody = await new File(manipulated.uri).arrayBuffer();

      const path = `${userData.user.id}/avatar/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, fileBody, {
          contentType: "image/jpeg",
          cacheControl: IMMUTABLE_CACHE,
        });
      if (error) throw error;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", userData.user.id);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["avatar-url"] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", userData.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
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

      // Lists always use the small thumbnail; legacy rows without one fall
      // back to the full image until the migration script backfills them.
      const coverPathOf = (images: ItemImage[]): string | null =>
        images[0] ? (images[0].thumb_path ?? images[0].storage_path) : null;

      const coverPaths = withSortedImages
        .map((row) => coverPathOf(row.images))
        .filter((p): p is string => Boolean(p));
      const urlMap = await getSignedUrls(coverPaths);

      return withSortedImages.map((row) => {
        const cover = coverPathOf(row.images);
        return {
          ...row,
          cover_url: cover ? (urlMap.get(cover) ?? null) : null,
          cover_path: cover,
        };
      });
    },
  });
}

export function useItemImages(item: MobileItem | undefined) {
  return useQuery({
    queryKey: ["item-images", item?.id, item?.images.length],
    enabled: Boolean(item && item.images.length > 0),
    queryFn: async (): Promise<
      { id: string; url: string; path: string; thumbUrl: string; thumbPath: string }[]
    > => {
      const paths = item!.images.flatMap((img) =>
        img.thumb_path
          ? [img.storage_path, img.thumb_path]
          : [img.storage_path],
      );
      const urlMap = await getSignedUrls(paths);
      return item!.images
        .map((img) => {
          const thumbPath = img.thumb_path ?? img.storage_path;
          return {
            id: img.id,
            url: urlMap.get(img.storage_path) ?? "",
            path: img.storage_path,
            thumbUrl: urlMap.get(thumbPath) ?? "",
            thumbPath,
          };
        })
        .filter((entry) => entry.url !== "");
    },
  });
}

/** One year — filenames are unique per upload, so they are immutable. */
const IMMUTABLE_CACHE = "31536000";

/**
 * Supabase's React Native client requires an ArrayBuffer; Blob, File and
 * FormData uploads do not work reliably in React Native.
 */
async function uploadFile(path: string, uri: string): Promise<void> {
  const fileBody = await new File(uri).arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, fileBody, {
    contentType: "image/webp",
    cacheControl: IMMUTABLE_CACHE,
  });
  if (error) throw error;
}

/**
 * Create + upload a display image (~1400px) and a thumbnail (~480px) for a
 * picked photo. Lists load only the thumbnail, keeping egress tiny.
 */
async function uploadPhoto(
  userId: string,
  itemId: string,
  uri: string,
  sortOrder: number,
  isMain: boolean,
): Promise<void> {
  const [display, thumb] = await Promise.all([
    manipulateAsync(uri, [{ resize: { width: 1400 } }], {
      compress: 0.76,
      format: SaveFormat.WEBP,
    }),
    manipulateAsync(uri, [{ resize: { width: 480 } }], {
      compress: 0.7,
      format: SaveFormat.WEBP,
    }),
  ]);

  const base = `${userId}/${itemId}/${Date.now()}-${sortOrder}`;
  const displayPath = `${base}-display.webp`;
  const thumbPath = `${base}-thumb.webp`;

  await uploadFile(displayPath, display.uri);
  try {
    await uploadFile(thumbPath, thumb.uri);
  } catch (error) {
    // Don't leave a display image without its thumbnail row.
    await supabase.storage.from(BUCKET).remove([displayPath]);
    throw error;
  }

  const { error: rowError } = await supabase.from("item_images").insert({
    item_id: itemId,
    user_id: userId,
    storage_path: displayPath,
    thumb_path: thumbPath,
    sort_order: sortOrder,
    is_main: isMain,
  });
  if (rowError) throw rowError;
}

export interface ItemInput {
  category_id: string;
  name: string;
  brand: string | null;
  series: string | null;
  status: string;
  condition: string | null;
  quantity: number;
  purchase_price: number | null;
  current_value: number | null;
  currency: string;
  purchase_date: string | null;
  location: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      photoUris,
    }: {
      input: ItemInput;
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
      await Promise.all(
        photoUris.map((uri, i) =>
          uploadPhoto(userData.user.id, itemId, uri, i, i === 0),
        ),
      );
      return itemId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      item,
      input,
      newPhotoUris,
      removedImageIds,
    }: {
      item: MobileItem;
      input: ItemInput;
      newPhotoUris: string[];
      removedImageIds: string[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const { error } = await supabase
        .from("items")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;

      if (removedImageIds.length > 0) {
        const removed = item.images.filter((img) =>
          removedImageIds.includes(img.id),
        );
        await supabase.storage
          .from(BUCKET)
          .remove(
            removed.flatMap((img) =>
              img.thumb_path
                ? [img.storage_path, img.thumb_path]
                : [img.storage_path],
            ),
          );
        const { error: imgError } = await supabase
          .from("item_images")
          .delete()
          .in("id", removedImageIds);
        if (imgError) throw imgError;
      }

      const remaining = item.images.filter(
        (img) => !removedImageIds.includes(img.id),
      );
      const hasMain = remaining.some((img) => img.is_main);
      await Promise.all(
        newPhotoUris.map((uri, i) =>
          uploadPhoto(
            userData.user.id,
            item.id,
            uri,
            remaining.length + i,
            !hasMain && i === 0,
          ),
        ),
      );

      if (!hasMain && newPhotoUris.length === 0 && remaining.length > 0) {
        await supabase
          .from("item_images")
          .update({ is_main: true })
          .eq("id", remaining[0].id);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items"] });
      void queryClient.invalidateQueries({ queryKey: ["item-images"] });
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
          .remove(
            item.images.flatMap((img) =>
              img.thumb_path
                ? [img.storage_path, img.thumb_path]
                : [img.storage_path],
            ),
          );
      }
      const { error } = await supabase.from("items").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
