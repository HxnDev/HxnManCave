import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDeleteItem, useItemImages, useItems } from "@/lib/api";
import { colors, radius, statusColors } from "@/lib/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: items, isLoading } = useItems();
  const item = items?.find((entry) => entry.id === id);
  const { data: imageUrls } = useItemImages(item);
  const deleteItem = useDeleteItem();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Item not found.</Text>
      </View>
    );
  }

  const status = statusColors[item.status] ?? statusColors.owned;
  const customFields = Object.entries(item.custom_fields ?? {}).filter(
    ([, value]) => value !== null && value !== "" && value !== undefined,
  );

  const confirmDelete = () => {
    Alert.alert("Delete item", `Remove "${item.name}" from the vault?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteItem.mutate(item, {
            onSuccess: () => router.back(),
            onError: (error) => Alert.alert("Delete failed", error.message),
          });
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: item.name }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {imageUrls && imageUrls.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {imageUrls.map((url) => (
              <Image
                key={url}
                source={{ uri: url }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.9 }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.noImage, { width: SCREEN_WIDTH }]}>
            <Text style={{ fontSize: 44 }}>📦</Text>
          </View>
        )}

        <View style={{ padding: 16, gap: 16 }}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item.name}</Text>
              <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusPillText, { color: status.text }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.category}>
              {item.category.name}
              {item.brand ? ` · ${item.brand}` : ""}
            </Text>
          </View>

          <View style={styles.card}>
            <Row label="Quantity" value={String(item.quantity)} />
            {item.condition && <Row label="Condition" value={item.condition} />}
            {item.purchase_price !== null && (
              <Row
                label="Purchase price"
                value={`${item.purchase_price.toLocaleString()} ${item.currency}`}
              />
            )}
            {item.current_value !== null && (
              <Row
                label="Current value"
                value={`${item.current_value.toLocaleString()} ${item.currency}`}
              />
            )}
            {item.purchase_date && <Row label="Purchased" value={item.purchase_date} />}
            {item.location && <Row label="Location" value={item.location} />}
          </View>

          {customFields.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Details</Text>
              {customFields.map(([key, value]) => (
                <Row
                  key={key}
                  label={key.replaceAll("_", " ")}
                  value={typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                />
              ))}
            </View>
          )}

          {item.notes && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notes}>{item.notes}</Text>
            </View>
          )}

          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <Text style={styles.deleteText}>
              {deleteItem.isPending ? "Deleting…" : "Delete item"}
            </Text>
          </Pressable>

          <Text style={styles.hint}>
            To edit details or manage photos, open this item on vault.hxndev.com.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  noImage: {
    height: 220,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", flex: 1 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  category: { color: colors.muted, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: {
    color: colors.muted,
    fontSize: 13,
    textTransform: "capitalize",
  },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  notes: { color: colors.text, fontSize: 14, lineHeight: 21 },
  deleteButton: {
    borderWidth: 1,
    borderColor: "rgba(229,72,77,0.4)",
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  deleteText: { color: colors.destructive, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 12, textAlign: "center" },
});
