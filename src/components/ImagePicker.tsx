import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
]);

interface Props {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

/** Single-image picker with drag/drop and a local preview. */
export default function ImagePicker({
  label,
  file,
  onChange,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function accept(incoming: File) {
    const ext = extensionOf(incoming.name);
    if (!IMAGE_EXTENSIONS.has(ext)) {
      setRejectMessage(`Unsupported file type: ${incoming.name}`);
      return;
    }
    setRejectMessage(null);
    onChange(incoming);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const next = event.dataTransfer.files[0];
    if (next) accept(next);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-300">{label}</p>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center
                    overflow-hidden rounded-2xl border border-dashed transition
                    ${
                      disabled
                        ? "cursor-not-allowed border-neutral-800 opacity-50"
                        : dragging
                          ? "border-sky-500/70 bg-sky-500/5"
                          : "border-neutral-700 bg-neutral-900/40 hover:border-neutral-500"
                    }`}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={file?.name ?? "Selected"}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8">
              <p className="truncate text-xs text-neutral-200">{file?.name}</p>
            </div>
          </>
        ) : (
          <div className="px-4 text-center">
            <p className="text-sm text-neutral-300">Drop a face photo</p>
            <p className="mt-1 text-xs text-neutral-500">or click to browse</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={[...IMAGE_EXTENSIONS].join(",")}
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next) accept(next);
            event.target.value = "";
          }}
        />
      </div>

      {file && !disabled && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-neutral-500 transition hover:text-neutral-300"
        >
          Clear
        </button>
      )}

      {rejectMessage && (
        <p className="text-xs text-red-300">{rejectMessage}</p>
      )}
    </div>
  );
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}
