import type { Tag } from "@mancave/shared";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async (): Promise<Tag[]> => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Tag[];
    },
  });
}

/**
 * Ensures all tag names exist for the user and points the item's
 * item_tags rows at exactly this set.
 */
export async function syncItemTags(
  userId: string,
  itemId: string,
  tagNames: string[],
): Promise<void> {
  const names = [...new Set(tagNames.map((n) => n.trim()).filter(Boolean))];

  let tagIds: string[] = [];
  if (names.length > 0) {
    const { data, error } = await supabase
      .from("tags")
      .upsert(
        names.map((name) => ({ user_id: userId, name })),
        { onConflict: "user_id,name" },
      )
      .select("id");
    if (error) throw error;
    tagIds = (data ?? []).map((row) => (row as { id: string }).id);
  }

  const { error: deleteError } = await supabase
    .from("item_tags")
    .delete()
    .eq("item_id", itemId);
  if (deleteError) throw deleteError;

  if (tagIds.length > 0) {
    const { error: insertError } = await supabase.from("item_tags").insert(
      tagIds.map((tagId) => ({
        item_id: itemId,
        tag_id: tagId,
        user_id: userId,
      })),
    );
    if (insertError) throw insertError;
  }
}
