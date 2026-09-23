import { useEffect, useState } from "react";
import type { Photo } from "../api/types";

interface Props {
  photo: Photo;
  onClose: () => void;
  onDelete?: (photo: Photo) => void | Promise<void>;
}

export default function Lightbox({ photo, onClose, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete(photo);
      onClose();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

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

      <div
        className="flex flex-wrap items-center justify-center gap-3 text-sm text-neutral-400"
        onClick={(event) => event.stopPropagation()}
      >
        <span>{photo.filename}</span>
        {photo.score !== null && (
          <span className="tabular-nums text-sky-300">
            score {photo.score.toFixed(3)}
          </span>
        )}
      </div>

      <div
        className="absolute right-5 top-5 flex items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        {onDelete && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-red-900/80 px-3 py-1.5 text-sm text-red-300
                       transition hover:bg-red-950/60"
          >
            Delete
          </button>
        )}
        {onDelete && confirming && (
          <>
            <span className="text-sm text-neutral-400">Remove from library?</span>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-sm text-white
                         transition hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Confirm"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300
                         transition hover:bg-neutral-800"
            >
              Cancel
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm
                     text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
