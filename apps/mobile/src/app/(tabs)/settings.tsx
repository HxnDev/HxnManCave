import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, Check, LogOut, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
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
import { Card, SectionTitle } from "@/components/ui";
import {
  useAvatarUrl,
  useItems,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, font, radius } from "@/lib/theme";

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: avatarUrl } = useAvatarUrl(profile);
  const { data: items } = useItems();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const [name, setName] = useState("");

  useEffect(() => {
    if (profile?.display_name) setName(profile.display_name);
  }, [profile?.display_name]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      uploadAvatar.mutate(result.assets[0].uri, {
        onError: (error) => Alert.alert("Upload failed", error.message),
      });
    }
  };

  const saveName = () => {
    if (!name.trim()) return;
    updateProfile.mutate(name.trim(), {
      onError: (error) => Alert.alert("Could not save", error.message),
    });
  };

  const confirmSignOut = () => {
    Alert.alert("Sign out", "Lock the vault on this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void signOut().then(() => router.replace("/login"));
        },
      },
    ]);
  };

  const dirty = name.trim() !== (profile?.display_name ?? "") && name.trim() !== "";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en", {
        month: "long",
        year: "numeric",
      })
    : null;
  const totalItems = items?.length ?? 0;
  const ownedItems = items?.filter((i) => i.status === "owned") ?? [];
  const owned = ownedItems.length;
  const wishlist = items?.filter((i) => i.status === "wishlist").length ?? 0;

  // Net asset value: group by currency, report the dominant one.
  const totals = new Map<string, { spent: number; value: number }>();
  for (const item of ownedItems) {
    const entry = totals.get(item.currency) ?? { spent: 0, value: 0 };
    entry.spent += (item.purchase_price ?? 0) * item.quantity;
    entry.value += (item.current_value ?? item.purchase_price ?? 0) * item.quantity;
    totals.set(item.currency, entry);
  }
  const [topCurrency, vault] = [...totals.entries()].sort(
    (a, b) => b[1].value - a[1].value,
  )[0] ?? ["CHF", { spent: 0, value: 0 }];
  const net = vault.value - vault.spent;
  const fmt = (n: number) =>
    `${Math.round(n).toLocaleString()} ${topCurrency}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile */}
      <Card style={{ alignItems: "center", paddingVertical: 26 }}>
        <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <UserRound size={34} color={colors.primary} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            {uploadAvatar.isPending ? (
              <ActivityIndicator size={12} color={colors.onPrimary} />
            ) : (
              <Camera size={13} color={colors.onPrimary} strokeWidth={2.5} />
            )}
          </View>
        </Pressable>

        <Text style={styles.profileName}>
          {profile?.display_name ?? "Collector"}
        </Text>
        <Text style={styles.profileEmail}>{session?.user.email}</Text>
        {memberSince && (
          <Text style={styles.profileSince}>Collector since {memberSince}</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{owned}</Text>
            <Text style={styles.statLabel}>Owned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{wishlist}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
        </View>
      </Card>

      {/* Vault value */}
      <Card style={{ gap: 14 }}>
        <SectionTitle style={{ fontSize: 14 }}>Vault value</SectionTitle>
        <View style={styles.valueRow}>
          <View style={styles.valueCol}>
            <Text style={styles.valueAmount}>{fmt(vault.spent)}</Text>
            <Text style={styles.valueCaption}>Total spent</Text>
          </View>
          <View style={styles.valueCol}>
            <Text style={styles.valueAmount}>{fmt(vault.value)}</Text>
            <Text style={styles.valueCaption}>Current value</Text>
          </View>
          <View style={styles.valueCol}>
            <Text
              style={[
                styles.valueAmount,
                { color: net >= 0 ? colors.primary : colors.destructive },
              ]}
            >
              {net >= 0 ? "+" : "−"}
              {fmt(Math.abs(net))}
            </Text>
            <Text style={styles.valueCaption}>Net {net >= 0 ? "gain" : "loss"}</Text>
          </View>
        </View>
      </Card>

      {/* Account */}
      <Card style={{ gap: 14 }}>
        <SectionTitle style={{ fontSize: 14 }}>Account</SectionTitle>
        <View>
          <Text style={styles.label}>Display name</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />
            {dirty && (
              <Pressable
                style={styles.saveIcon}
                onPress={saveName}
                disabled={updateProfile.isPending}
              >
                <Check size={18} color={colors.onPrimary} strokeWidth={2.8} />
              </Pressable>
            )}
          </View>
        </View>
        <View>
          <Text style={styles.label}>Signed in with</Text>
          <Text style={styles.valueText}>
            {(session?.user.app_metadata.provider as string) ?? "email"}
          </Text>
        </View>
      </Card>

      {/* Sync */}
      <Card style={{ gap: 10 }}>
        <SectionTitle style={{ fontSize: 14 }}>Sync</SectionTitle>
        <Text style={styles.syncText}>
          Your vault syncs automatically with{" "}
          <Text style={{ color: colors.primary, fontFamily: font.semibold }}>
            vault.hxndev.com
          </Text>
          . Anything you add here shows up on the website instantly, and vice versa.
        </Text>
      </Card>

      <Pressable style={styles.signOut} onPress={confirmSignOut}>
        <LogOut size={16} color={colors.destructive} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={styles.footer}>ManCave · part of the hxndev.com ecosystem</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14, paddingBottom: 48 },
  avatarWrap: { marginBottom: 14 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  avatarFallback: {
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.card,
  },
  profileName: {
    color: colors.text,
    fontFamily: font.extrabold,
    fontSize: 21,
  },
  profileEmail: {
    color: colors.textSecondary,
    fontFamily: font.medium,
    fontSize: 13.5,
    marginTop: 2,
  },
  profileSince: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 12,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignSelf: "stretch",
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: {
    color: colors.text,
    fontFamily: font.extrabold,
    fontSize: 20,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  valueCol: { flex: 1 },
  valueAmount: {
    color: colors.text,
    fontFamily: font.extrabold,
    fontSize: 15,
  },
  valueCaption: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 11.5,
    marginTop: 2,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: font.semibold,
    fontSize: 13,
    marginBottom: 6,
  },
  valueText: {
    color: colors.text,
    fontFamily: font.semibold,
    fontSize: 15,
    textTransform: "capitalize",
  },
  nameRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    backgroundColor: colors.input,
    fontFamily: font.medium,
    fontSize: 15,
  },
  saveIcon: {
    width: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  syncText: {
    color: colors.textSecondary,
    fontFamily: font.regular,
    fontSize: 13.5,
    lineHeight: 20,
  },
  signOut: {
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
  signOutText: {
    color: colors.destructive,
    fontFamily: font.bold,
    fontSize: 14,
  },
  footer: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
