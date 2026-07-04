import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

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

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{session?.user.email}</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>Provider</Text>
        <Text style={styles.value}>
          {(session?.user.app_metadata.provider as string) ?? "email"}
        </Text>
      </View>

      <Pressable style={styles.signOut} onPress={confirmSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={styles.footer}>
        ManCave · vault.hxndev.com{"\n"}Your data syncs with the website automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  label: { color: colors.muted, fontSize: 12 },
  value: { color: colors.text, fontSize: 15, fontWeight: "600", marginTop: 2 },
  signOut: {
    borderWidth: 1,
    borderColor: "rgba(229,72,77,0.4)",
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  signOutText: { color: colors.destructive, fontWeight: "700" },
  footer: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: "auto",
    marginBottom: 16,
    lineHeight: 18,
  },
});
