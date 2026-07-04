import type { Category, FieldDefinition } from "@mancave/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CategoryWithCount extends Category {
  item_count: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, items(count)")
        .order("sort_order", { ascending: true });
      if (error) throw error;

      return (data ?? []).map((row) => {
        const { items, ...category } = row as Category & {
          items: { count: number }[];
        };
        return { ...category, item_count: items[0]?.count ?? 0 };
      });
    },
  });
}

export interface CategoryInput {
  name: string;
  slug: string;
  icon: string;
  color: string;
  field_template: FieldDefinition[];
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const { data, error } = await supabase
        .from("categories")
        .insert({ ...input, user_id: userData.user.id, sort_order: 100 })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CategoryInput> & { id: string }) => {
      const { error } = await supabase.from("categories").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["categories"] }),
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
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
