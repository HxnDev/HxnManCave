import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { colors, font, radius, statusColors, STATUS_LABELS } from "@/lib/theme";

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

export function StatusPill({ status, small }: { status: string; small?: boolean }) {
  const palette = statusColors[status] ?? statusColors.owned;
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: palette.bg },
        small && { paddingHorizontal: 8, paddingVertical: 2 },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: palette.text },
          small && { fontSize: 10 },
        ]}
      >
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  activeColor = colors.primary,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor?: string;
  icon?: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && {
          backgroundColor: `${activeColor}22`,
          borderColor: activeColor,
        },
      ]}
    >
      {icon}
      <Text style={[styles.chipText, active && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  pillText: {
    fontFamily: font.bold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  chipText: {
    color: colors.muted,
    fontFamily: font.semibold,
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: 32,
    gap: 6,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 18,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
