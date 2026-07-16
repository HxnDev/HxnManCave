import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { ItemForm } from "@/components/item-form";
import { useCategories, useItemImages, useItems, useUpdateItem } from "@/lib/api";
import { colors, font } from "@/lib/theme";

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: categories } = useCategories();
  const { data: items, isLoading } = useItems();
  const item = items?.find((entry) => entry.id === id);
  const { data: images } = useItemImages(item);
  const updateItem = useUpdateItem();

  if (isLoading || !categories) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted, fontFamily: font.medium }}>
          Item not found.
        </Text>
      </View>
    );
  }

  return (
    <ItemForm
      categories={categories}
      item={item}
      existingImages={(images ?? []).map((img) => ({
        id: img.id,
        url: img.thumbUrl || img.url,
      }))}
      busy={updateItem.isPending}
      submitLabel="Save changes"
      onSubmit={(input, newPhotoUris, removedImageIds) => {
        updateItem.mutate(
          { item, input, newPhotoUris, removedImageIds },
          {
            onSuccess: () => router.back(),
            onError: (error) => Alert.alert("Could not save", error.message),
          },
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
