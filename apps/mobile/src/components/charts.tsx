import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, font, radius } from "@/lib/theme";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/** Category distribution donut, drawn with SVG stroke arcs. */
export function DonutChart({
  slices,
  total,
  size = 168,
}: {
  slices: DonutSlice[];
  total: number;
  size?: number;
}) {
  const strokeWidth = 22;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const sum = slices.reduce((acc, slice) => acc + slice.value, 0) || 1;

  let offset = 0;
  const arcs = slices.map((slice) => {
    const fraction = slice.value / sum;
    const arc = {
      ...slice,
      dash: fraction * circumference,
      offset,
    };
    offset += fraction * circumference;
    return arc;
  });

  return (
    <View style={styles.donutRow}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.cardElevated}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {arcs.map((arc) => (
            <Circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="butt"
              strokeDasharray={`${Math.max(arc.dash - 2, 1)} ${circumference}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ))}
        </Svg>
        <View style={styles.donutCenter} pointerEvents="none">
          <Text style={styles.donutTotal}>{total}</Text>
          <Text style={styles.donutCaption}>items</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {slices.slice(0, 6).map((slice) => (
          <View key={slice.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {slice.label}
            </Text>
            <Text style={styles.legendValue}>{slice.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export interface MonthBar {
  label: string;
  value: number;
}

/** Items added per month, simple bar chart. */
export function MonthlyBars({ months }: { months: MonthBar[] }) {
  const max = Math.max(...months.map((m) => m.value), 1);
  return (
    <View style={styles.barsRow}>
      {months.map((month) => (
        <View key={month.label} style={styles.barCol}>
          <Text style={styles.barValue}>{month.value > 0 ? month.value : ""}</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  height: `${Math.max((month.value / max) * 100, month.value > 0 ? 8 : 3)}%`,
                  backgroundColor:
                    month.value > 0 ? colors.primary : colors.cardElevated,
                },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{month.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  donutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  donutCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  donutTotal: {
    color: colors.text,
    fontFamily: font.extrabold,
    fontSize: 30,
  },
  donutCaption: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 12,
    marginTop: -2,
  },
  legend: { flex: 1, gap: 8 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontFamily: font.medium,
    fontSize: 13,
    flex: 1,
  },
  legendValue: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 13,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    paddingTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
  },
  barValue: {
    color: colors.textSecondary,
    fontFamily: font.bold,
    fontSize: 11,
    height: 16,
  },
  barTrack: {
    flex: 1,
    width: 18,
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 5,
  },
  barLabel: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 10,
    marginTop: 6,
  },
});
