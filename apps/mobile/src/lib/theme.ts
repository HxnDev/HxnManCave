/** ManCave "lounge" palette — mirrors apps/web design tokens. */
export const colors = {
  background: "#0F1714",
  card: "#17211D",
  cardElevated: "#1C2823",
  border: "rgba(255,255,255,0.09)",
  input: "rgba(255,255,255,0.13)",
  text: "#E8EEE9",
  muted: "#92A096",
  primary: "#3DDBA5",
  onPrimary: "#0A2018",
  destructive: "#E5484D",
  wood: "#7A5C3B",
  woodDark: "#4E3B26",
  amber: "#E0A83E",
};

export const statusColors: Record<string, { bg: string; text: string }> = {
  owned: { bg: "rgba(61,219,165,0.15)", text: "#3DDBA5" },
  wishlist: { bg: "rgba(224,168,62,0.15)", text: "#E0A83E" },
  sold: { bg: "rgba(160,170,165,0.15)", text: "#A0AAA5" },
  gifted: { bg: "rgba(90,180,240,0.15)", text: "#5AB4F0" },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};
