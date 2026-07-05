import { router, useLocalSearchParams } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/category-icon";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useItems,
  useUpdateCategory,
} from "@/lib/api";
import { colors, font, radius, tint, toRnColor } from "@/lib/theme";

/** Same palette the website offers. */
const COLOR_OPTIONS = [
  "oklch(0.63 0.22 25)",
  "oklch(0.68 0.15 45)",
  "oklch(0.78 0.14 75)",
  "oklch(0.72 0.13 140)",
  "oklch(0.7 0.12 195)",
  "oklch(0.7 0.11 230)",
  "oklch(0.66 0.16 260)",
  "oklch(0.67 0.24 295)",
  "oklch(0.65 0.17 300)",
  "oklch(0.62 0.19 350)",
  "oklch(0.63 0.2 15)",
  "oklch(0.64 0.015 80)",
];

const ICON_KEYS = Object.keys(CATEGORY_ICONS);

export default function CategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: categories } = useCategories();
  const { data: items } = useItems();
  const existing = id ? categories?.find((c) => c.id === id) : undefined;

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState(existing?.icon ?? "package");
  const [color, setColor] = useState(existing?.color ?? COLOR_OPTIONS[3]);

  const busy =
    createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;
  const itemCount = (items ?? []).filter((i) => i.category_id === id).length;

  const save = () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Give the shelf a name.");
      return;
    }
    const input = { name: name.trim(), icon, color };
    const options = {
      onSuccess: () => router.back(),
      onError: (error: Error) => Alert.alert("Could not save", error.message),
    };
    if (existing) {
      updateCategory.mutate({ id: existing.id, ...input }, options);
    } else {
      createCategory.mutate(input, options);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    if (itemCount > 0) {
      Alert.alert(
        "Shelf not empty",
        `"${existing.name}" still holds ${itemCount} item${itemCount === 1 ? "" : "s"}. Move or delete them first.`,
      );
      return;
    }
    Alert.alert("Delete shelf", `Remove "${existing.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteCategory.mutate(existing.id, {
            onSuccess: () => router.back(),
            onError: (error) => Alert.alert("Delete failed", error.message),
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Live preview */}
      <View style={styles.preview}>
        <CategoryIcon icon={icon} color={color} size={56} />
        <Text style={styles.previewName}>{name.trim() || "New shelf"}</Text>
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Vinyl Records"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Icon</Text>
      <View style={styles.grid}>
        {ICON_KEYS.map((key) => {
          const Icon = CATEGORY_ICONS[key];
          const active = icon === key;
          return (
            <Pressable
              key={key}
              style={[
                styles.iconCell,
                active && {
                  backgroundColor: tint(color),
                  borderColor: toRnColor(color),
                },
              ]}
              onPress={() => setIcon(key)}
            >
              <Icon
                size={20}
                color={active ? toRnColor(color) : colors.muted}
                strokeWidth={2}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Color</Text>
      <View style={styles.grid}>
        {COLOR_OPTIONS.map((option) => {
          const active = color === option;
          return (
            <Pressable
              key={option}
              style={[
                styles.colorCell,
                { backgroundColor: toRnColor(option) },
                active && styles.colorCellActive,
              ]}
              onPress={() => setColor(option)}
            />
          );
        })}
      </View>

      <Pressable
        style={[styles.saveButton, busy && { opacity: 0.6 }]}
        onPress={save}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.saveText}>
            {existing ? "Save changes" : "Create shelf"}
          </Text>
        )}
      </Pressable>

      {existing && (
        <Pressable style={styles.deleteButton} onPress={confirmDelete}>
          <Trash2 size={16} color={colors.destructive} />
          <Text style={styles.deleteText}>Delete shelf</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12, paddingBottom: 56 },
  preview: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
  },
  previewName: {
    color: colors.text,
    fontFamily: font.extrabold,
    fontSize: 20,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: font.semibold,
    fontSize: 13,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.input,
    fontFamily: font.medium,
    fontSize: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconCell: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  colorCell: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
  },
  colorCellActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 14,
  },
  saveText: {
    color: colors.onPrimary,
    fontFamily: font.extrabold,
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(240,106,110,0.35)",
    backgroundColor: colors.destructiveSoft,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  deleteText: {
    color: colors.destructive,
    fontFamily: font.bold,
    fontSize: 14,
  },
});
