import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCategories, useCreateItem } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const STATUSES = ["owned", "wishlist", "sold", "gifted"] as const;

export default function AddItemScreen() {
  const { data: categories } = useCategories();
  const createItem = useCreateItem();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("owned");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera blocked", "Allow camera access in system settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 1,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const submit = () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Give the item a name.");
      return;
    }
    if (!categoryId) {
      Alert.alert("Missing category", "Pick a shelf for this item.");
      return;
    }
    const parsedPrice = price.trim() ? Number(price.replace(",", ".")) : null;
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      Alert.alert("Invalid price", "Enter a number, e.g. 49.99");
      return;
    }

    createItem.mutate(
      {
        input: {
          category_id: categoryId,
          name: name.trim(),
          brand: brand.trim() || null,
          status,
          purchase_price: parsedPrice,
          currency: "CHF",
          notes: notes.trim() || null,
        },
        photoUris: photos,
      },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert("Could not save", error.message),
      },
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.photoRow}>
        {photos.map((uri, index) => (
          <Pressable
            key={uri}
            onLongPress={() =>
              setPhotos((prev) => prev.filter((_, i) => i !== index))
            }
          >
            <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
          </Pressable>
        ))}
        <Pressable style={styles.photoAdd} onPress={takePhoto}>
          <Text style={{ fontSize: 20 }}>📷</Text>
          <Text style={styles.photoAddText}>Camera</Text>
        </Pressable>
        <Pressable style={styles.photoAdd} onPress={pickPhotos}>
          <Text style={{ fontSize: 20 }}>🖼️</Text>
          <Text style={styles.photoAddText}>Gallery</Text>
        </Pressable>
      </View>
      {photos.length > 0 && (
        <Text style={styles.photoHint}>Long-press a photo to remove it.</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Item name *"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Brand / series"
        placeholderTextColor={colors.muted}
        value={brand}
        onChangeText={setBrand}
      />

      <Text style={styles.sectionLabel}>Shelf *</Text>
      <View style={styles.chipWrap}>
        {(categories ?? []).map((category) => {
          const active = categoryId === category.id;
          return (
            <Pressable
              key={category.id}
              style={[
                styles.chip,
                active && { backgroundColor: `${category.color}26`, borderColor: category.color },
              ]}
              onPress={() => setCategoryId(category.id)}
            >
              <Text style={[styles.chipText, active && { color: colors.text }]}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Status</Text>
      <View style={styles.chipWrap}>
        {STATUSES.map((entry) => {
          const active = status === entry;
          return (
            <Pressable
              key={entry}
              style={[
                styles.chip,
                active && {
                  backgroundColor: "rgba(61,219,165,0.15)",
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setStatus(entry)}
            >
              <Text style={[styles.chipText, active && { color: colors.primary }]}>
                {entry}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Purchase price (CHF)"
        placeholderTextColor={colors.muted}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: "top" }]}
        placeholder="Notes"
        placeholderTextColor={colors.muted}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Pressable
        style={[styles.saveButton, createItem.isPending && { opacity: 0.6 }]}
        onPress={submit}
        disabled={createItem.isPending}
      >
        {createItem.isPending ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.saveText}>Add to the vault</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>
        Custom fields (set number, author, ISBN…) can be filled in on the website.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  photoAdd: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  photoAddText: { color: colors.muted, fontSize: 10 },
  photoHint: { color: colors.muted, fontSize: 11 },
  input: {
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.card,
  },
  sectionLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.card,
  },
  chipText: { color: colors.muted, fontSize: 13, textTransform: "capitalize" },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { color: colors.onPrimary, fontWeight: "800", fontSize: 15 },
  hint: { color: colors.muted, fontSize: 12, textAlign: "center" },
});
