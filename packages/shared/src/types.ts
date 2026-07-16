/** Item lifecycle status. */
export type ItemStatus = "owned" | "wishlist" | "sold" | "gifted";

/** Physical condition of an item. */
export type ItemCondition = "new" | "used" | "sealed" | "damaged";

/** A single custom field definition inside a category's field template. */
export interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  /** Options for `select` fields. */
  options?: string[];
  /** Optional suffix shown after the value, e.g. "%" or "ml". */
  unit?: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  field_template: FieldDefinition[];
  sort_order: number;
  created_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  brand: string | null;
  series: string | null;
  description: string | null;
  quantity: number;
  purchase_price: number | null;
  current_value: number | null;
  currency: string;
  purchase_date: string | null;
  status: ItemStatus;
  condition: ItemCondition | null;
  location: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  user_id: string;
  /** Display-size image (~1400px WebP), shown on item detail screens. */
  storage_path: string;
  /** Small thumbnail (~480px WebP) for lists/grids; null on legacy rows. */
  thumb_path: string | null;
  sort_order: number;
  is_main: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}
