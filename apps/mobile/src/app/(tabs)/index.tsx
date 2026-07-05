import type { Category } from "@mancave/shared";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronRight, Library, Plus, Search } from "lucide-react-native";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryIcon } from "@/components/category-icon";
import { Chip, EmptyState, StatusPill } from "@/components/ui";
import {
  useCategories,
  useItems,
  useProfile,
  type MobileItem,
} from "@/lib/api";
import { colors, font, radius, STATUS_LABELS, tint, toRnColor } from "@/lib/theme";

const STATUS_FILTERS = ["owned", "wishlist", "sold", "gifted"];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function ShelfCard({ item }: { item: MobileItem }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.itemCard,
        pressed && { transform: [{ scale: 0.96 }], opacity: 0.92 },
      ]}
      onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
    >
      {item.cover_url ? (
        <Image
          source={{ uri: item.cover_url }}
          style={styles.itemImage}
          contentFit="cover"
          transition={180}
        />
      ) : (
        <View style={[styles.itemImage, styles.itemPlaceholder]}>
          <CategoryIcon icon={item.category.icon} color={item.category.color} size={46} />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(5,10,8,0.55)", "rgba(5,10,8,0.92)"]}
        locations={[0.45, 0.72, 1]}
        style={styles.itemOverlay}
      />
      <View style={styles.itemText}>
        <Text numberOfLines={1} style={styles.itemName}>
          {item.name}
        </Text>
        {item.brand ? (
          <Text numberOfLines={1} style={styles.itemBrand}>
            {item.brand}
          </Text>
        ) : null}
      </View>
      {item.status !== "owned" && (
        <View style={styles.itemStatus}>
          <StatusPill status={item.status} small />
        </View>
      )}
    </Pressable>
  );
}

function Shelf({
  category,
  items,
  index,
}: {
  category: Category;
  items: MobileItem[];
  index: number;
}) {
  const accent = toRnColor(category.color);
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).springify().damping(16)}
      style={styles.shelf}
    >
      {/* Accent hairline that ties the section to its category color */}
      <View style={[styles.shelfAccent, { backgroundColor: accent }]} />
      <Pressable
        style={({ pressed }) => [styles.shelfHeader, pressed && { opacity: 0.7 }]}
        onPress={() =>
          router.push({ pathname: "/category/[id]", params: { id: category.id } })
        }
      >
        <CategoryIcon icon={category.icon} color={category.color} size={32} />
        <Text style={styles.shelfTitle}>{category.name}</Text>
        <View style={[styles.shelfCountBadge, { backgroundColor: tint(category.color) }]}>
          <Text style={[styles.shelfCount, { color: accent }]}>{items.length}</Text>
        </View>
        <ChevronRight size={17} color={colors.muted} />
      </Pressable>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ShelfCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        showsHorizontalScrollIndicator={false}
      />
    </Animated.View>
  );
}

export default function ShelvesScreen() {
  const { data: categories } = useCategories();
  const { data: items, isLoading, refetch, isRefetching } = useItems();
  const { data: profile } = useProfile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const firstName = profile?.display_name?.split(" ")[0];

  const shelves = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (items ?? []).filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.brand ?? "").toLowerCase().includes(q) ||
        (item.series ?? "").toLowerCase().includes(q) ||
        (item.notes ?? "").toLowerCase().includes(q)
      );
    });
    return (categories ?? [])
      .map((category) => ({
        category,
        items: filtered.filter((item) => item.category_id === category.id),
      }))
      .filter((shelf) => shelf.items.length > 0);
  }, [categories, items, search, statusFilter]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>{greeting()}</Text>
          <Text style={styles.heroTitle}>
            {firstName ? `${firstName}'s vault` : "Your vault"}
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <Search size={17} color={colors.muted} />
          <TextInput
            style={styles.search}
            placeholder="Search the vault…"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <Chip
            label="All"
            active={statusFilter === null}
            onPress={() => setStatusFilter(null)}
          />
          {STATUS_FILTERS.map((status) => (
            <Chip
              key={status}
              label={STATUS_LABELS[status]}
              active={statusFilter === status}
              onPress={() =>
                setStatusFilter(statusFilter === status ? null : status)
              }
            />
          ))}
        </ScrollView>

        {!isLoading && shelves.length === 0 && (
          <EmptyState
            icon={<Library size={30} color={colors.primary} />}
            title={search || statusFilter ? "Nothing matches" : "The shelves are empty"}
            text={
              search || statusFilter
                ? "Try a different search or filter."
                : "Tap + to add your first item to the vault."
            }
          />
        )}

        {shelves.map((shelf, index) => (
          <Shelf
            key={shelf.category.id}
            category={shelf.category}
            items={shelf.items}
            index={index}
          />
        ))}
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.92 }] }]}
        onPress={() => router.push("/add")}
      >
        <Plus size={28} color={colors.onPrimary} strokeWidth={2.6} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  heroKicker: {
    color: colors.primary,
    fontFamily: font.bold,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontFamily: font.extrabold,
    fontSize: 30,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.input,
  },
  search: {
    flex: 1,
    paddingVertical: 11,
    color: colors.text,
    fontFamily: font.medium,
    fontSize: 15,
  },
  filters: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  shelf: { marginBottom: 26 },
  shelfAccent: {
    height: 3,
    width: 36,
    borderRadius: 2,
    marginLeft: 20,
    marginBottom: 10,
    opacity: 0.9,
  },
  shelfHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  shelfTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 17.5,
    flex: 1,
  },
  shelfCountBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  shelfCount: {
    fontFamily: font.extrabold,
    fontSize: 12.5,
  },
  itemCard: {
    width: 138,
    height: 184,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardElevated,
  },
  itemOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  itemText: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },
  itemStatus: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  itemName: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 13,
  },
  itemBrand: {
    color: "rgba(234,241,236,0.72)",
    fontFamily: font.medium,
    fontSize: 11,
    marginTop: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
});
