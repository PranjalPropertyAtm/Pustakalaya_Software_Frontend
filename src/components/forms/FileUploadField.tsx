import { useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadFieldProps {
  label: string;
  name?: string;
  className?: string;
  accept?: string;
  maxSizeMb?: number;
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  preview?: boolean;
}

export function FileUploadField({
  label,
  accept = "image/*,application/pdf",
  maxSizeMb = 5,
  value,
  onChange,
  error,
  preview = true,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file && file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    onChange(file);
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`File must be under ${maxSizeMb}MB`);
      return;
    }
    handleFile(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50",
          error && "border-destructive"
        )}
      >
        {value ? (
          <div className="flex w-full items-center gap-3">
            {preview && previewUrl ? (
              <img src={previewUrl} alt="Upload preview" width={64} height={64} loading="lazy" className="h-16 w-16 rounded object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                {value.type.startsWith("image/") ? (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <FileText className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{value.name}</p>
              <p className="text-xs text-muted-foreground">{(value.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => handleFile(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm">Click to upload</span>
            <span className="text-xs">Max {maxSizeMb}MB</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onSelect} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
