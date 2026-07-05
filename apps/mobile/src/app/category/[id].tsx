import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { PackageOpen, Pencil } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState, StatusPill } from "@/components/ui";
import { useCategories, useItems, type MobileItem } from "@/lib/api";
import { colors, font, radius } from "@/lib/theme";

function GridCard({ item }: { item: MobileItem }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
      ]}
      onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
    >
      {item.cover_url ? (
        <Image
          source={{ uri: item.cover_url }}
          style={styles.image}
          contentFit="cover"
          transition={180}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <CategoryIcon icon={item.category.icon} color={item.category.color} size={48} />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(5,10,8,0.55)", "rgba(5,10,8,0.92)"]}
        locations={[0.4, 0.7, 1]}
        style={styles.overlay}
      />
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={styles.name}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {[
            item.brand,
            item.current_value != null
              ? `${item.current_value.toLocaleString()} ${item.currency}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      {item.status !== "owned" && (
        <View style={styles.status}>
          <StatusPill status={item.status} small />
        </View>
      )}
    </Pressable>
  );
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: categories } = useCategories();
  const { data: items } = useItems();

  const category = categories?.find((entry) => entry.id === id);
  const categoryItems = (items ?? []).filter((item) => item.category_id === id);

  return (
    <>
      <Stack.Screen
        options={{
          title: category?.name ?? "",
          headerTitleStyle: { fontFamily: font.bold, color: colors.text },
          headerRight: () => (
            <Pressable
              style={styles.editButton}
              hitSlop={8}
              onPress={() =>
                router.push({ pathname: "/category-form", params: { id: id! } })
              }
            >
              <Pencil size={16} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={styles.container}
        data={categoryItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 14, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 14, paddingVertical: 16, paddingBottom: 48 }}
        renderItem={({ item }) => <GridCard item={item} />}
        ListEmptyComponent={
          <EmptyState
            icon={<PackageOpen size={30} color={colors.primary} />}
            title="Empty shelf"
            text="No items in this category yet."
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flex: 1,
    height: 200,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardElevated,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
  },
  textWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 11,
  },
  status: { position: "absolute", top: 8, right: 8 },
  name: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 14,
  },
  meta: {
    color: "rgba(234,241,236,0.72)",
    fontFamily: font.medium,
    fontSize: 11.5,
    marginTop: 1,
  },
});
