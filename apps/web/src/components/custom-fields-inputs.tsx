import type { FieldDefinition } from "@mancave/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/**
 * Renders a category's field template as form inputs.
 * Values live in a plain record that maps onto the items.custom_fields JSONB.
 */
export function CustomFieldsInputs({
  template,
  values,
  onChange,
}: {
  template: FieldDefinition[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}) {
  if (template.length === 0) return null;

  const setValue = (key: string, value: unknown) => {
    const next = { ...values };
    if (value === "" || value === undefined || value === null) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {template.map((field) => {
        const raw = values[field.key];

        if (field.type === "boolean") {
          return (
            <div
              key={field.key}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
            >
              <Label htmlFor={`cf-${field.key}`} className="cursor-pointer">
                {field.label}
              </Label>
              <Switch
                id={`cf-${field.key}`}
                checked={Boolean(raw)}
                onCheckedChange={(checked) => setValue(field.key, checked)}
              />
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Select
                value={typeof raw === "string" ? raw : ""}
                onValueChange={(value) => setValue(field.key, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`cf-${field.key}`}>
              {field.label}
              {field.unit && (
                <span className="text-muted-foreground"> ({field.unit})</span>
              )}
            </Label>
            <Input
              id={`cf-${field.key}`}
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              step={field.type === "number" ? "any" : undefined}
              value={raw === undefined ? "" : String(raw)}
              onChange={(e) => {
                const value = e.target.value;
                setValue(
                  field.key,
                  field.type === "number" && value !== "" ? Number(value) : value,
                );
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
