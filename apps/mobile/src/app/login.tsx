import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  const { signInWithPassword, signUp, signInWithGoogle } = useAuth();

  const submit = async () => {
    if (!email.trim() || password.length < 8) {
      Alert.alert("Check your details", "Enter a valid email and a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) {
          Alert.alert("Sign in failed", error);
          return;
        }
        router.replace("/(tabs)");
      } else {
        if (!displayName.trim()) {
          Alert.alert("Missing name", "Tell us your name.");
          return;
        }
        const { error } = await signUp(email.trim(), password, displayName.trim());
        if (error) {
          Alert.alert("Sign up failed", error);
          return;
        }
        Alert.alert("Account created", "Check your inbox to confirm your email, then sign in.");
        setMode("login");
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert("Google sign-in failed", error);
        return;
      }
      router.replace("/(tabs)");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🗄️</Text>
        </View>
        <Text style={styles.title}>
          Man<Text style={{ color: colors.primary }}>Cave</Text>
        </Text>
        <Text style={styles.subtitle}>
          {mode === "login" ? "Open the vault" : "Claim your vault"}
        </Text>

        <Pressable style={styles.googleButton} onPress={google} disabled={busy}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>

        <Text style={styles.divider}>or</Text>

        {mode === "signup" && (
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable style={styles.primaryButton} onPress={submit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryText}>
              {mode === "login" ? "Sign in" : "Create account"}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(mode === "login" ? "signup" : "login")}>
          <Text style={styles.switchText}>
            {mode === "login" ? "No account yet? " : "Already have an account? "}
            <Text style={{ color: colors.primary }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  logoBox: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: "rgba(61,219,165,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(61,219,165,0.3)",
  },
  logoIcon: { fontSize: 30 },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  googleText: { color: colors.text, fontWeight: "600" },
  divider: { color: colors.muted, textAlign: "center", fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.card,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryText: { color: colors.onPrimary, fontWeight: "700" },
  switchText: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 12,
  },
});
