import type { ItemImage } from "@mancave/shared";
import { ImagePlus, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ExistingImage {
  image: ItemImage;
  url: string;
}

/**
 * Photo picker for the item form.
 * Shows existing (already uploaded) images and newly selected files;
 * the first image overall acts as the cover.
 */
export function ImageUploader({
  existing = [],
  onRemoveExisting,
  files,
  onFilesChange,
}: {
  existing?: ExistingImage[];
  onRemoveExisting?: (image: ExistingImage) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const isCover = (index: number) => existing.length === 0 && index === 0;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {existing.map((entry, i) => (
          <div
            key={entry.image.id}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
          >
            <img
              src={entry.url}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-primary backdrop-blur">
                <Star className="size-3 fill-current" /> Cover
              </span>
            )}
            {onRemoveExisting && (
              <button
                type="button"
                onClick={() => onRemoveExisting(entry)}
                className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-md bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-destructive"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        ))}

        {files.map((file, i) => (
          <div
            key={`${file.name}-${i}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-primary/30 bg-muted"
          >
            <img src={previews[i]} alt="" className="size-full object-cover" />
            {isCover(i) && (
              <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-primary backdrop-blur">
                <Star className="size-3 fill-current" /> Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
              className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-md bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-destructive"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground transition-colors",
            "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
          )}
        >
          <ImagePlus className="size-5" />
          <span className="text-xs">Add photos</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? []);
          if (selected.length > 0) onFilesChange([...files, ...selected]);
          e.target.value = "";
        }}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Photos are compressed automatically. The first photo is the cover.
      </p>
    </div>
  );
}
