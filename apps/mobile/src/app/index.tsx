import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function Gate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/login"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
