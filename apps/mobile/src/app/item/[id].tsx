import { categoryShowsMoney } from "@mancave/shared";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
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
import { CategoryIcon } from "@/components/category-icon";
import { Card, SectionTitle, StatusPill } from "@/components/ui";
import { useDeleteItem, useItemImages, useItems } from "@/lib/api";
import { colors, font, radius } from "@/lib/theme";

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
  const { data: images } = useItemImages(item);
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
        <Text style={{ color: colors.muted, fontFamily: font.medium }}>
          Item not found.
        </Text>
      </View>
    );
  }

  const customFields = Object.entries(item.custom_fields ?? {}).filter(
    ([, value]) => value !== null && value !== "" && value !== undefined,
  );
  const fieldLabels = new Map(
    item.category.field_template.map((field) => [field.key, field]),
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
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <Pressable
              style={styles.editButton}
              onPress={() =>
                router.push({ pathname: "/edit/[id]", params: { id: item.id } })
              }
            >
              <Pencil size={15} color={colors.onPrimary} strokeWidth={2.4} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
        {images && images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {images.map((image) => (
              <Image
                key={image.id}
                source={{ uri: image.url }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85 }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.noImage, { width: SCREEN_WIDTH }]}>
            <CategoryIcon icon={item.category.icon} color={item.category.color} size={72} />
          </View>
        )}

        <View style={styles.body}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item.name}</Text>
              <StatusPill status={item.status} />
            </View>
            <Text style={styles.subtitle}>
              {[item.category.name, item.brand, item.series].filter(Boolean).join(" · ")}
            </Text>
          </View>

          {categoryShowsMoney(item.category.slug) &&
            (item.purchase_price !== null || item.current_value !== null) && (
              <Card style={{ gap: 12 }}>
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
              </Card>
            )}

          {customFields.length > 0 && (
            <Card style={{ gap: 12 }}>
              <SectionTitle style={{ fontSize: 14 }}>Details</SectionTitle>
              {customFields.map(([key, value]) => {
                const def = fieldLabels.get(key);
                const label = def?.label ?? key.replaceAll("_", " ");
                const display =
                  typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : `${String(value)}${def?.unit ? ` ${def.unit}` : ""}`;
                return <Row key={key} label={label} value={display} />;
              })}
            </Card>
          )}

          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <Trash2 size={16} color={colors.destructive} />
            <Text style={styles.deleteText}>
              {deleteItem.isPending ? "Deleting…" : "Delete item"}
            </Text>
          </Pressable>
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  editText: {
    color: colors.onPrimary,
    fontFamily: font.bold,
    fontSize: 13,
  },
  noImage: {
    height: 240,
    backgroundColor: colors.backgroundRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20, gap: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontFamily: font.extrabold,
    fontSize: 23,
    flex: 1,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 14,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 13.5,
  },
  rowValue: {
    color: colors.text,
    fontFamily: font.semibold,
    fontSize: 13.5,
    flexShrink: 1,
    textAlign: "right",
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
