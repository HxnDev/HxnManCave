import { router, Stack } from "expo-router";
import { ChevronRight, Pencil, Plus } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CategoryIcon } from "@/components/category-icon";
import { useCategories, useItems } from "@/lib/api";
import { colors, font, radius } from "@/lib/theme";

export default function CategoriesScreen() {
  const { data: categories } = useCategories();
  const { data: items } = useItems();

  const counts = new Map<string, number>();
  for (const item of items ?? []) {
    counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/category-form")}
            >
              <Plus size={17} color={colors.onPrimary} strokeWidth={2.6} />
              <Text style={styles.addText}>New shelf</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={styles.container}
        data={categories ?? []}
        keyExtractor={(category) => category.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 48 }}
        renderItem={({ item: category, index }) => {
          const count = counts.get(category.id) ?? 0;
          return (
            <Animated.View
              entering={FadeInDown.delay(index * 45).springify().damping(16)}
            >
              <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
                onPress={() =>
                  router.push({ pathname: "/category/[id]", params: { id: category.id } })
                }
              >
                <CategoryIcon icon={category.icon} color={category.color} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{category.name}</Text>
                  <Text style={styles.count}>
                    {count === 0 ? "Empty shelf" : count === 1 ? "1 item" : `${count} items`}
                  </Text>
                </View>
                <Pressable
                  style={styles.editIcon}
                  hitSlop={8}
                  onPress={() =>
                    router.push({ pathname: "/category-form", params: { id: category.id } })
                  }
                >
                  <Pencil size={15} color={colors.muted} />
                </Pressable>
                <ChevronRight size={18} color={colors.muted} />
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginRight: 16,
  },
  addText: {
    color: colors.onPrimary,
    fontFamily: font.bold,
    fontSize: 13,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  name: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 15.5,
  },
  count: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 12.5,
    marginTop: 1,
  },
  editIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
  },
});
