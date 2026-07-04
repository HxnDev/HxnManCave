import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTags } from "@/hooks/use-tags";

export function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const { data: allTags } = useTags();

  const addTag = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!value.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...value, trimmed]);
    }
    setDraft("");
  };

  const suggestions = (allTags ?? [])
    .map((tag) => tag.name)
    .filter(
      (name) => !value.some((t) => t.toLowerCase() === name.toLowerCase()),
    );

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="grid size-4 place-items-center rounded-full hover:bg-foreground/15"
                aria-label={`Remove ${tag}`}
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(draft);
          } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => addTag(draft)}
        placeholder="Harry Potter, F1, Limited Edition… (Enter to add)"
        list="tag-suggestions"
      />
      <datalist id="tag-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}
