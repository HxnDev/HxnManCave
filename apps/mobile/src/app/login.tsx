import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { colors, font, radius } from "@/lib/theme";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  const { signInWithPassword, signUp, signInWithGoogle } = useAuth();

  const submit = async () => {
    if (!email.trim() || password.length < 8) {
      Alert.alert(
        "Check your details",
        "Enter a valid email and a password of at least 8 characters.",
      );
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
        Alert.alert(
          "Account created",
          "Check your inbox to confirm your email, then sign in.",
        );
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
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            contentFit="cover"
          />
          <Text style={styles.title}>
            Man<Text style={{ color: colors.primary }}>Cave</Text>
          </Text>
          <Text style={styles.subtitle}>
            {mode === "login" ? "Open the vault" : "Claim your vault"}
          </Text>

          <Pressable style={styles.googleButton} onPress={google} disabled={busy}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <Text style={styles.divider}>— or —</Text>

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

          <Pressable
            style={[styles.primaryButton, busy && { opacity: 0.6 }]}
            onPress={submit}
            disabled={busy}
          >
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
              <Text style={{ color: colors.primary, fontFamily: font.bold }}>
                {mode === "login" ? "Sign up" : "Sign in"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 32,
    gap: 12,
  },
  logo: {
    alignSelf: "center",
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  title: {
    color: colors.text,
    fontFamily: font.extrabold,
    fontSize: 32,
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 14.5,
    textAlign: "center",
    marginBottom: 18,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 14,
    backgroundColor: colors.card,
  },
  googleG: {
    color: colors.primary,
    fontFamily: font.extrabold,
    fontSize: 17,
  },
  googleText: {
    color: colors.text,
    fontFamily: font.semibold,
    fontSize: 15,
  },
  divider: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 12,
    fontFamily: font.medium,
    marginVertical: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    backgroundColor: colors.input,
    fontFamily: font.medium,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: {
    color: colors.onPrimary,
    fontFamily: font.extrabold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  switchText: {
    color: colors.muted,
    fontFamily: font.medium,
    textAlign: "center",
    marginTop: 14,
    fontSize: 14,
  },
});
