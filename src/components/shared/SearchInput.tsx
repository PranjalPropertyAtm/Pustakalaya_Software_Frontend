import { memo, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
  /** Debounce delay before calling onChange (ms). 0 = immediate. */
  debounceMs?: number;
}

function SearchInputInner({
  value,
  onChange,
  placeholder = "Search…",
  className,
  onSubmit,
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (debounceMs === 0) return;
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, debounceMs, onChange, value]);

  const handleChange = (next: string) => {
    setLocalValue(next);
    if (debounceMs === 0) onChange(next);
  };

  return (
    <div className={cn("relative max-w-sm flex-1", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        className="h-9 pl-9 pr-9 bg-card"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.();
        }}
        aria-label={placeholder}
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => handleChange("")}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export const SearchInput = memo(SearchInputInner);
