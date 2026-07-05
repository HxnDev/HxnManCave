import type { FieldDefinition } from "./types";

export interface DefaultCategory {
  name: string;
  slug: string;
  /** lucide icon name (kebab-case) */
  icon: string;
  /** oklch color string used as the category accent */
  color: string;
  field_template: FieldDefinition[];
}

/**
 * Seeded for every new user (see the `handle_new_user` trigger in the
 * initial schema migration — keep the two in sync).
 */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: "LEGO Sets",
    slug: "lego",
    icon: "blocks",
    color: "oklch(0.63 0.22 25)",
    field_template: [
      { key: "set_number", label: "Set Number", type: "text" },
      { key: "pieces", label: "Pieces", type: "number" },
      { key: "year", label: "Year", type: "number" },
      { key: "theme", label: "Theme", type: "text" },
      { key: "minifigures", label: "Minifigures", type: "number" },
      { key: "built", label: "Built", type: "boolean" },
    ],
  },
  {
    name: "Funko Pops",
    slug: "funko",
    icon: "person-standing",
    color: "oklch(0.65 0.17 300)",
    field_template: [
      { key: "pop_number", label: "Pop Number", type: "text" },
      { key: "franchise", label: "Franchise", type: "text" },
      { key: "exclusive", label: "Exclusive", type: "text" },
      { key: "boxed", label: "In Box", type: "boolean" },
    ],
  },
  {
    name: "Books",
    slug: "books",
    icon: "book-open",
    color: "oklch(0.7 0.12 195)",
    field_template: [
      { key: "author", label: "Author", type: "text" },
      { key: "publisher", label: "Publisher", type: "text" },
      { key: "isbn", label: "ISBN", type: "text" },
      { key: "pages", label: "Pages", type: "number" },
      { key: "language", label: "Language", type: "text" },
      { key: "read", label: "Read", type: "boolean" },
    ],
  },
  {
    name: "Table Decor",
    slug: "table-decor",
    icon: "lamp-desk",
    color: "oklch(0.72 0.13 140)",
    field_template: [
      { key: "material", label: "Material", type: "text" },
      { key: "origin", label: "Origin", type: "text" },
    ],
  },
  {
    name: "Souvenirs",
    slug: "souvenirs",
    icon: "gift",
    color: "oklch(0.68 0.15 45)",
    field_template: [
      { key: "country", label: "Country", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "trip_year", label: "Trip Year", type: "number" },
    ],
  },
  {
    name: "Keychains",
    slug: "keychains",
    icon: "key-round",
    color: "oklch(0.78 0.14 75)",
    field_template: [
      { key: "country", label: "Country", type: "text" },
      { key: "city", label: "City", type: "text" },
    ],
  },
  {
    name: "Perfumes",
    slug: "perfumes",
    icon: "spray-can",
    color: "oklch(0.62 0.19 350)",
    field_template: [
      { key: "size_ml", label: "Size", type: "number", unit: "ml" },
      {
        key: "concentration",
        label: "Concentration",
        type: "select",
        options: ["EDT", "EDP", "Parfum", "Extrait", "Cologne"],
      },
    ],
  },
  {
    name: "Card Games",
    slug: "card-games",
    icon: "spade",
    color: "oklch(0.63 0.2 15)",
    field_template: [],
  },
  {
    name: "Online Games",
    slug: "online-games",
    icon: "gamepad-2",
    color: "oklch(0.66 0.16 260)",
    field_template: [
      {
        key: "platform",
        label: "Platform",
        type: "select",
        options: ["Steam", "Epic", "PlayStation", "Xbox", "Nintendo", "GOG", "Other"],
      },
      {
        key: "format",
        label: "Format",
        type: "select",
        options: ["Digital", "Physical"],
      },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "cpu",
    color: "oklch(0.7 0.11 230)",
    field_template: [
      { key: "model", label: "Model", type: "text" },
      { key: "serial_number", label: "Serial Number", type: "text" },
      { key: "warranty_until", label: "Warranty Until", type: "date" },
    ],
  },
  {
    name: "Other",
    slug: "other",
    icon: "package",
    color: "oklch(0.64 0.015 80)",
    field_template: [],
  },
];

/**
 * Category slugs where the money fields (paid / current value / currency)
 * are hidden in item forms and detail views.
 */
export const MONEY_HIDDEN_CATEGORY_SLUGS: string[] = [
  "funko",
  "books",
  "perfumes",
  "souvenirs",
  "keychains",
  "card-games",
  "online-games",
  "electronics",
];

/** Whether items in the given category show the paid / value fields. */
export function categoryShowsMoney(slug: string | null | undefined): boolean {
  return !slug || !MONEY_HIDDEN_CATEGORY_SLUGS.includes(slug);
}
