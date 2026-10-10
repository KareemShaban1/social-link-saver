import { useMemo, useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formFieldClass } from "@/lib/formStyles";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function normalize(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").toLowerCase();
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  disabled,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const filteredSuggestions = useMemo(() => {
    const q = normalize(draft);
    const selected = new Set(value.map(normalize));
    return suggestions
      .map(normalize)
      .filter((s) => s && !selected.has(s) && (!q || s.includes(q)))
      .slice(0, 8);
  }, [draft, suggestions, value]);

  const addTag = (raw: string) => {
    const tag = normalize(raw);
    if (!tag || value.map(normalize).includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => normalize(t) !== normalize(tag)));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (draft.trim()) addTag(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5",
          disabled && "opacity-60",
        )}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 text-xs">
            {tag}
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeTag(tag)}
              className="rounded-full outline-none hover:bg-muted"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) addTag(draft);
          }}
          placeholder={value.length === 0 ? placeholder : undefined}
          className={cn(
            "h-7 min-w-[8rem] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0",
            formFieldClass,
          )}
        />
      </div>
      {filteredSuggestions.length > 0 && draft.trim() && (
        <div className="flex flex-wrap gap-1.5">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
