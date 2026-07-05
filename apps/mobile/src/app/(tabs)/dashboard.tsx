import { Image } from "expo-image";
import { router } from "expo-router";
import { Boxes, Heart, Layers, Wallet } from "lucide-react-native";
import type { ReactNode } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CategoryIcon } from "@/components/category-icon";
import { DonutChart, MonthlyBars, type MonthBar } from "@/components/charts";
import { Card, SectionTitle } from "@/components/ui";
import { useCategories, useItems, type MobileItem } from "@/lib/api";
import { colors, font, radius, toRnColor } from "@/lib/theme";

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${accent}1F` }]}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function RecentItem({ item }: { item: MobileItem }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.recentRow, pressed && { opacity: 0.8 }]}
      onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
    >
      {item.cover_url ? (
        <Image source={{ uri: item.cover_url }} style={styles.recentImage} contentFit="cover" />
      ) : (
        <View style={[styles.recentImage, styles.recentPlaceholder]}>
          <CategoryIcon icon={item.category.icon} color={item.category.color} size={26} iconSize={15} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.recentName}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.recentMeta}>
          {item.category.name}
        </Text>
      </View>
      {item.current_value != null && (
        <Text style={styles.recentValue}>
          {item.current_value.toLocaleString()} {item.currency}
        </Text>
      )}
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { data: categories } = useCategories();
  const { data: items, refetch, isRefetching } = useItems();

  const total = items?.length ?? 0;
  const wishlist = items?.filter((i) => i.status === "wishlist").length ?? 0;

  const owned = (items ?? []).filter(
    (i) => i.status === "owned" && (i.current_value ?? i.purchase_price) !== null,
  );
  const byCurrency = new Map<string, number>();
  for (const item of owned) {
    const itemValue = (item.current_value ?? item.purchase_price ?? 0) * item.quantity;
    byCurrency.set(item.currency, (byCurrency.get(item.currency) ?? 0) + itemValue);
  }
  const topCurrency = [...byCurrency.entries()].sort((a, b) => b[1] - a[1])[0];

  const usedCategories = (categories ?? [])
    .map((category) => ({
      category,
      count: (items ?? []).filter((i) => i.category_id === category.id).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const slices = usedCategories.map(({ category, count }) => ({
    label: category.name,
    value: count,
    color: toRnColor(category.color),
  }));

  const months: MonthBar[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      label: date.toLocaleDateString("en", { month: "short" }),
      value: (items ?? []).filter((item) => item.created_at.startsWith(key)).length,
    });
  }

  const recent = (items ?? []).slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.statsRow}>
        <StatCard
          label="Total items"
          value={String(total)}
          accent={colors.primary}
          icon={<Boxes size={17} color={colors.primary} />}
        />
        <StatCard
          label="Wishlist"
          value={String(wishlist)}
          accent={colors.amber}
          icon={<Heart size={17} color={colors.amber} />}
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          label="Categories in use"
          value={String(usedCategories.length)}
          accent={colors.sky}
          icon={<Layers size={17} color={colors.sky} />}
        />
        <StatCard
          label={topCurrency ? `Value (${topCurrency[0]})` : "Collection value"}
          value={topCurrency ? Math.round(topCurrency[1]).toLocaleString() : "—"}
          accent={colors.primaryBright}
          icon={<Wallet size={17} color={colors.primaryBright} />}
        />
      </View>

      {slices.length > 0 && (
        <Animated.View entering={FadeInDown.delay(120).springify().damping(16)}>
          <Card>
            <SectionTitle style={{ marginBottom: 18 }}>Collection breakdown</SectionTitle>
            <DonutChart slices={slices} total={total} />
          </Card>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(200).springify().damping(16)}>
        <Card>
          <SectionTitle style={{ marginBottom: 6 }}>Added per month</SectionTitle>
          <MonthlyBars months={months} />
        </Card>
      </Animated.View>

      {recent.length > 0 && (
        <Animated.View entering={FadeInDown.delay(280).springify().damping(16)}>
          <Card>
            <SectionTitle style={{ marginBottom: 14 }}>Recently added</SectionTitle>
            <View style={{ gap: 12 }}>
              {recent.map((item) => (
                <RecentItem key={item.id} item={item} />
              ))}
            </View>
          </Card>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14, paddingBottom: 48 },
  statsRow: { flexDirection: "row", gap: 14 },
  statCard: { flex: 1, padding: 16 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    color: colors.text,
    fontFamily: font.extrabold,
    fontSize: 26,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 12.5,
    marginTop: 2,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recentImage: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.cardElevated,
  },
  recentPlaceholder: { alignItems: "center", justifyContent: "center" },
  recentName: {
    color: colors.text,
    fontFamily: font.semibold,
    fontSize: 14,
  },
  recentMeta: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 12,
    marginTop: 1,
  },
  recentValue: {
    color: colors.textSecondary,
    fontFamily: font.bold,
    fontSize: 13,
  },
});
