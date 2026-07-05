/** ManCave "lounge" design system — mirrors the web app's emerald/walnut theme. */

export const colors = {
  background: "#0D1512",
  backgroundRaised: "#111A16",
  card: "#16211C",
  cardElevated: "#1B2822",
  border: "rgba(190,230,210,0.10)",
  borderStrong: "rgba(190,230,210,0.18)",
  input: "#141F1A",
  text: "#EAF1EC",
  textSecondary: "#B7C4BB",
  muted: "#7E8F84",
  primary: "#34D399",
  primaryBright: "#4AE8AF",
  onPrimary: "#06251A",
  primarySoft: "rgba(52,211,153,0.12)",
  primaryBorder: "rgba(52,211,153,0.35)",
  destructive: "#F06A6E",
  destructiveSoft: "rgba(240,106,110,0.12)",
  amber: "#E8B349",
  amberSoft: "rgba(232,179,73,0.14)",
  sky: "#62B6F0",
  skySoft: "rgba(98,182,240,0.14)",
  slate: "#9AA8A0",
  slateSoft: "rgba(154,168,160,0.14)",
};

export const font = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extrabold: "Manrope_800ExtraBold",
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  full: 999,
};

export const statusColors: Record<string, { bg: string; text: string }> = {
  owned: { bg: colors.primarySoft, text: colors.primary },
  wishlist: { bg: colors.amberSoft, text: colors.amber },
  sold: { bg: colors.slateSoft, text: colors.slate },
  gifted: { bg: colors.skySoft, text: colors.sky },
};

export const STATUS_LABELS: Record<string, string> = {
  owned: "Owned",
  wishlist: "Wishlist",
  sold: "Sold",
  gifted: "Gifted",
};

export const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  used: "Used",
  sealed: "Sealed",
  damaged: "Damaged",
};

/* ---------------------------------------------------------------- */
/* oklch() → hex conversion.                                         */
/* Category colors are stored as CSS oklch() strings (picked on the  */
/* web); React Native only understands rgb/hex, so we convert.       */
/* ---------------------------------------------------------------- */

function oklchToRgb(l: number, c: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const toSrgb = (x: number) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };
  return [toSrgb(r), toSrgb(g), toSrgb(bl)];
}

const oklchCache = new Map<string, string>();

/** Convert any CSS color coming from the DB into something RN can render. */
export function toRnColor(color: string): string {
  if (!color.startsWith("oklch")) return color;
  const cached = oklchCache.get(color);
  if (cached) return cached;

  const match = color.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) return "#9AA8A0";
  const [r, g, b] = oklchToRgb(Number(match[1]), Number(match[2]), Number(match[3]));
  const hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  oklchCache.set(color, hex);
  return hex;
}

/** Translucent tint of a (possibly oklch) color for icon chips. */
export function tint(color: string, alpha = 0.16): string {
  const hex = toRnColor(color);
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
