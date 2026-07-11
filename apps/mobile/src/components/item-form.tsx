import {
  categoryBrandLabel,
  categoryShowsBrand,
  categoryShowsMoney,
  categoryShowsName,
  categoryShowsSeries,
  categoryShowsStatus,
  deriveItemName,
  withBooleanDefaults,
  type Category,
  type FieldDefinition,
} from "@mancave/shared";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Approximate native-stack header height (dp), added to the top inset. */
const HEADER_HEIGHT = 56;
import type { ItemInput, MobileItem } from "@/lib/api";
import {
  colors,
  font,
  radius,
  STATUS_LABELS,
  toRnColor,
} from "@/lib/theme";
import { CategoryIcon } from "./category-icon";
import { Chip } from "./ui";

const STATUSES = ["owned", "wishlist"];

interface ExistingImage {
  id: string;
  url: string;
}

export function ItemForm({
  categories,
  item,
  existingImages = [],
  busy,
  submitLabel,
  onSubmit,
}: {
  categories: Category[];
  item?: MobileItem;
  existingImages?: ExistingImage[];
  busy: boolean;
  submitLabel: string;
  onSubmit: (
    input: ItemInput,
    newPhotoUris: string[],
    removedImageIds: string[],
  ) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [brand, setBrand] = useState(item?.brand ?? "");
  const [series, setSeries] = useState(item?.series ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    item?.category_id ?? null,
  );
  const [status, setStatus] = useState(item?.status ?? "owned");
  const [price, setPrice] = useState(
    item?.purchase_price != null ? String(item.purchase_price) : "",
  );
  const [value, setValue] = useState(
    item?.current_value != null ? String(item.current_value) : "",
  );
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(
    item?.custom_fields ?? {},
  );
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );
  const showBrand = categoryShowsBrand(category?.slug);
  const showSeries = categoryShowsSeries(category?.slug);
  const showName = categoryShowsName(category?.slug);
  const showStatus = categoryShowsStatus(category?.slug);
  const brandLabel = categoryBrandLabel(category?.slug);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera blocked", "Allow camera access in system settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled && result.assets[0]) {
      setNewPhotos((prev) => [...prev, result.assets[0].uri]);
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
      setNewPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const parseNumber = (raw: string): number | null => {
    if (!raw.trim()) return null;
    const parsed = Number(raw.replace(",", "."));
    return Number.isNaN(parsed) ? null : parsed;
  };

  const submit = () => {
    if (!categoryId) {
      Alert.alert("Missing shelf", "Pick a shelf for this item.");
      return;
    }
    if (showName && !name.trim()) {
      Alert.alert("Missing name", "Give the item a name.");
      return;
    }

    const finalCustomFields = withBooleanDefaults(
      category?.field_template ?? [],
      customFields,
    );

    onSubmit(
      {
        category_id: categoryId,
        name: showName
          ? name.trim()
          : deriveItemName(category?.slug, finalCustomFields, category?.name ?? "Item"),
        // Hidden fields are cleared so stale values don't survive a shelf change.
        brand: showBrand
          ? brand.trim() || (category?.slug === "lego" ? "LEGO" : null)
          : null,
        series: showSeries ? series.trim() || null : null,
        status,
        // Fields no longer editable in the form; keep existing values on edit.
        condition: item?.condition ?? null,
        quantity: item?.quantity ?? 1,
        purchase_price: parseNumber(price),
        current_value: parseNumber(value),
        currency: item?.currency ?? "CHF",
        purchase_date: item?.purchase_date ?? null,
        location: item?.location ?? null,
        notes: item?.notes ?? null,
        custom_fields: finalCustomFields,
      },
      newPhotos,
      removedIds,
    );
  };

  const visibleExisting = existingImages.filter(
    (img) => !removedIds.includes(img.id),
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={insets.top + HEADER_HEIGHT}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Shelf comes first; everything else appears after picking one. */}
      <Text style={styles.label}>Shelf *</Text>
      <View style={styles.chipWrap}>
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            active={categoryId === cat.id}
            activeColor={toRnColor(cat.color)}
            icon={<CategoryIcon icon={cat.icon} color={cat.color} size={18} iconSize={12} />}
            onPress={() => {
              if (cat.id !== categoryId) setCustomFields(item?.custom_fields ?? {});
              setCategoryId(cat.id);
              if (cat.slug === "lego" && !brand.trim()) setBrand("LEGO");
            }}
          />
        ))}
      </View>

      {category && (
        <>
          {/* Photos */}
          <Text style={styles.label}>Photos</Text>
          <View style={styles.photoRow}>
            {visibleExisting.map((img) => (
              <View key={img.id}>
                <Image source={{ uri: img.url }} style={styles.photoThumb} contentFit="cover" />
                <Pressable
                  style={styles.photoRemove}
                  onPress={() => setRemovedIds((prev) => [...prev, img.id])}
                >
                  <X size={12} color={colors.text} strokeWidth={3} />
                </Pressable>
              </View>
            ))}
            {newPhotos.map((uri, index) => (
              <View key={uri}>
                <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                <Pressable
                  style={styles.photoRemove}
                  onPress={() =>
                    setNewPhotos((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <X size={12} color={colors.text} strokeWidth={3} />
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.photoAdd} onPress={takePhoto}>
              <Camera size={20} color={colors.primary} />
              <Text style={styles.photoAddText}>Camera</Text>
            </Pressable>
            <Pressable style={styles.photoAdd} onPress={pickPhotos}>
              <ImagePlus size={20} color={colors.primary} />
              <Text style={styles.photoAddText}>Gallery</Text>
            </Pressable>
          </View>

          {/* Basics */}
          {showName && (
            <Field label="Name *">
              <TextInput
                style={styles.input}
                placeholder="LEGO McLaren F1..."
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
              />
            </Field>
          )}
          {(showBrand || showSeries) && (
            <View style={styles.rowSplit}>
              {showBrand && (
                <Field label={brandLabel} style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder={brandLabel === "Studio" ? "Rockstar Games" : "LEGO"}
                    placeholderTextColor={colors.muted}
                    value={brand}
                    onChangeText={setBrand}
                  />
                </Field>
              )}
              {showSeries && (
                <Field label="Series" style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Technic"
                    placeholderTextColor={colors.muted}
                    value={series}
                    onChangeText={setSeries}
                  />
                </Field>
              )}
            </View>
          )}

          {/* Status */}
          {showStatus && (
            <>
              <Text style={styles.label}>Status</Text>
              <View style={styles.chipWrap}>
                {STATUSES.map((entry) => (
                  <Chip
                    key={entry}
                    label={STATUS_LABELS[entry]}
                    active={status === entry}
                    onPress={() => setStatus(entry as typeof status)}
                  />
                ))}
              </View>
            </>
          )}

          {/* Money (hidden for some categories) */}
          {categoryShowsMoney(category?.slug) && (
            <View style={styles.rowSplit}>
              <Field label={`Paid (${item?.currency ?? "CHF"})`} style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="49.99"
                  placeholderTextColor={colors.muted}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </Field>
              <Field label={`Value (${item?.currency ?? "CHF"})`} style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="99.99"
                  placeholderTextColor={colors.muted}
                  value={value}
                  onChangeText={setValue}
                  keyboardType="decimal-pad"
                />
              </Field>
            </View>
          )}

          {/* Custom fields for the selected category */}
          {category.field_template.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: 4 }]}>
                {category.name} details
              </Text>
              {category.field_template.map((field) => (
                <CustomFieldInput
                  key={field.key}
                  field={field}
                  value={customFields[field.key]}
                  onChange={(newValue) =>
                    setCustomFields((prev) => ({ ...prev, [field.key]: newValue }))
                  }
                />
              ))}
            </>
          )}

          <Pressable
            style={[styles.saveButton, busy && { opacity: 0.6 }]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.saveText}>{submitLabel}</Text>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function CustomFieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{field.label}</Text>
        <Switch
          // Untouched booleans default to ON (see withBooleanDefaults).
          value={value === undefined ? true : Boolean(value)}
          onValueChange={onChange}
          trackColor={{ false: colors.cardElevated, true: colors.primaryBorder }}
          thumbColor={value === undefined || value ? colors.primary : colors.muted}
        />
      </View>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <Field label={field.label}>
        <View style={styles.chipWrap}>
          {field.options.map((option) => (
            <Chip
              key={option}
              label={option}
              active={value === option}
              onPress={() => onChange(value === option ? null : option)}
            />
          ))}
        </View>
      </Field>
    );
  }

  return (
    <Field label={field.unit ? `${field.label} (${field.unit})` : field.label}>
      <TextInput
        style={styles.input}
        placeholder={field.type === "date" ? "YYYY-MM-DD" : field.label}
        placeholderTextColor={colors.muted}
        value={value == null ? "" : String(value)}
        onChangeText={(text) => {
          if (field.type === "number") {
            const parsed = Number(text.replace(",", "."));
            onChange(text.trim() === "" ? null : Number.isNaN(parsed) ? text : parsed);
          } else {
            onChange(text);
          }
        }}
        keyboardType={field.type === "number" ? "decimal-pad" : "default"}
      />
    </Field>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14, paddingBottom: 56 },
  label: {
    color: colors.textSecondary,
    fontFamily: font.semibold,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.input,
    fontFamily: font.medium,
    fontSize: 15,
  },
  rowSplit: { flexDirection: "row", gap: 10 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoThumb: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  photoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  photoAdd: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoAddText: {
    color: colors.primary,
    fontFamily: font.semibold,
    fontSize: 11,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  switchLabel: {
    color: colors.text,
    fontFamily: font.medium,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: {
    color: colors.onPrimary,
    fontFamily: font.extrabold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
