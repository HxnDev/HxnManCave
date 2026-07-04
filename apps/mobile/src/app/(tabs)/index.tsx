import type { Category } from "@mancave/shared";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCategories, useItems, type MobileItem } from "@/lib/api";
import { colors, radius, statusColors } from "@/lib/theme";

function ShelfCard({ item }: { item: MobileItem }) {
  const status = statusColors[item.status] ?? statusColors.owned;
  return (
    <Pressable
      style={styles.itemCard}
      onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
    >
      {item.cover_url ? (
        <Image source={{ uri: item.cover_url }} style={styles.itemImage} contentFit="cover" />
      ) : (
        <View style={[styles.itemImage, styles.itemPlaceholder]}>
          <Text style={{ fontSize: 22 }}>📦</Text>
        </View>
      )}
      {item.status !== "owned" && (
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>{item.status}</Text>
        </View>
      )}
      <Text numberOfLines={1} style={styles.itemName}>
        {item.name}
      </Text>
    </Pressable>
  );
}

function Shelf({ category, items }: { category: Category; items: MobileItem[] }) {
  return (
    <View style={styles.shelf}>
      <View style={styles.shelfHeader}>
        <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
        <Text style={styles.shelfTitle}>{category.name}</Text>
        <Text style={styles.shelfCount}>{items.length}</Text>
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ShelfCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.plank} />
    </View>
  );
}

export default function ShelvesScreen() {
  const { data: categories } = useCategories();
  const { data: items, isLoading, refetch, isRefetching } = useItems();
  const [search, setSearch] = useState("");

  const shelves = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (items ?? []).filter(
      (item) =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.brand ?? "").toLowerCase().includes(q) ||
        (item.notes ?? "").toLowerCase().includes(q),
    );
    return (categories ?? [])
      .map((category) => ({
        category,
        items: filtered.filter((item) => item.category_id === category.id),
      }))
      .filter((shelf) => shelf.items.length > 0);
  }, [categories, items, search]);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 96, paddingTop: 8 }}
      >
        <TextInput
          style={styles.search}
          placeholder="Search the vault…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />

        {!isLoading && shelves.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🗄️</Text>
            <Text style={styles.emptyTitle}>
              {search ? "Nothing matches" : "The shelves are empty"}
            </Text>
            <Text style={styles.emptyText}>
              {search
                ? "Try a different search."
                : "Tap + to add your first item."}
            </Text>
          </View>
        )}

        {shelves.map((shelf) => (
          <Shelf key={shelf.category.id} category={shelf.category} items={shelf.items} />
        ))}
      </ScrollView>

      <Link href="/add" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  search: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.card,
  },
  shelf: { marginBottom: 28 },
  shelfHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  shelfTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
  shelfCount: { color: colors.muted, fontSize: 13 },
  plank: {
    height: 10,
    marginHorizontal: 8,
    marginTop: 10,
    borderRadius: 3,
    backgroundColor: colors.wood,
    borderBottomWidth: 3,
    borderBottomColor: colors.woodDark,
  },
  itemCard: { width: 110 },
  itemImage: {
    width: 110,
    height: 110,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  itemPlaceholder: { alignItems: "center", justifyContent: "center" },
  itemName: {
    color: colors.text,
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  statusPill: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: { fontSize: 9, fontWeight: "700", textTransform: "capitalize" },
  empty: { alignItems: "center", paddingVertical: 64, gap: 8 },
  emptyTitle: { color: colors.text, fontWeight: "700", fontSize: 17 },
  emptyText: { color: colors.muted, fontSize: 13 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: colors.onPrimary, fontSize: 28, fontWeight: "700" },
});
