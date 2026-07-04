import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useCategories, useItems } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { data: categories } = useCategories();
  const { data: items } = useItems();

  const total = items?.length ?? 0;
  const wishlist = items?.filter((i) => i.status === "wishlist").length ?? 0;

  const owned = (items ?? []).filter(
    (i) => i.status === "owned" && (i.current_value ?? i.purchase_price) !== null,
  );
  const byCurrency = new Map<string, number>();
  for (const item of owned) {
    const value = (item.current_value ?? item.purchase_price ?? 0) * item.quantity;
    byCurrency.set(item.currency, (byCurrency.get(item.currency) ?? 0) + value);
  }
  const top = [...byCurrency.entries()].sort((a, b) => b[1] - a[1])[0];

  const biggest = (categories ?? [])
    .map((category) => ({
      category,
      count: (items ?? []).filter((i) => i.category_id === category.id).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={styles.row}>
        <StatCard label="Total items" value={String(total)} />
        <StatCard label="Wishlist" value={String(wishlist)} />
      </View>
      <View style={styles.row}>
        <StatCard label="Categories" value={String(categories?.length ?? 0)} />
        <StatCard
          label={top ? `Value (${top[0]})` : "Collection value"}
          value={top ? Math.round(top[1]).toLocaleString() : "—"}
        />
      </View>

      {biggest.length > 0 && (
        <View style={[styles.card, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Biggest shelves</Text>
          {biggest.map(({ category, count }) => (
            <View key={category.id} style={styles.shelfRow}>
              <View style={[styles.dot, { backgroundColor: category.color }]} />
              <Text style={styles.shelfName} numberOfLines={1}>
                {category.name}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: category.color,
                      width: `${Math.max((count / total) * 100, 4)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.shelfCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  value: { color: colors.text, fontSize: 26, fontWeight: "800" },
  label: { color: colors.muted, fontSize: 13, marginTop: 2 },
  sectionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 12,
  },
  shelfRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  shelfName: { color: colors.text, fontSize: 13, width: 90 },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  shelfCount: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
    width: 26,
    textAlign: "right",
  },
});
