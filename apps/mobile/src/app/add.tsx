import { router } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { ItemForm } from "@/components/item-form";
import { useCategories, useCreateItem } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function AddItemScreen() {
  const { data: categories } = useCategories();
  const createItem = useCreateItem();

  if (!categories) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ItemForm
      categories={categories}
      busy={createItem.isPending}
      submitLabel="Add to the vault"
      onSubmit={(input, photoUris) => {
        createItem.mutate(
          { input, photoUris },
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
