import { useEffect } from "react";
import type { Photo } from "../api/types";

interface Props {
  photo: Photo;
  onClose: () => void;
}

export default function Lightbox({ photo, onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.filename}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 p-6
                 backdrop-blur-sm"
    >
      {/* Full-size endpoint transcodes HEIC to JPEG, so this renders anywhere. */}
      <img
        src={photo.image_url}
        alt={photo.filename}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
      />

      <div className="flex items-center gap-3 text-sm text-neutral-400">
        <span>{photo.filename}</span>
        {photo.score !== null && (
          <span className="tabular-nums text-sky-300">
            score {photo.score.toFixed(3)}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm
                   text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
      >
        Close
      </button>
    </div>
  );
}
