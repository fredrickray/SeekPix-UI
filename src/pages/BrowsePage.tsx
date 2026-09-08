import { useCallback, useEffect, useState } from "react";
import { ApiError, getStats, listPhotos } from "../api/client";
import type { Photo, Stats } from "../api/types";
import Lightbox from "../components/Lightbox";
import PhotoGrid from "../components/PhotoGrid";
import { GridSkeleton, Notice } from "../components/States";

const PAGE_SIZE = 30;

interface Props {
  onStatsChange?: (stats: Stats | null) => void;
}

export default function BrowsePage({ onStatsChange }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Photo | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const offset = page * PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + photos.length, total);

  const refreshStats = useCallback(() => {
    getStats()
      .then((stats) => onStatsChange?.(stats))
      .catch(() => onStatsChange?.(null));
  }, [onStatsChange]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats, reloadToken]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listPhotos({ limit: PAGE_SIZE, offset }, controller.signal)
      .then((result) => {
        setPhotos(result.items);
        setTotal(result.total);
        setLoading(false);
        // If the library shrank (e.g. after a later delete), snap back a page.
        const lastPage = Math.max(0, Math.ceil(result.total / PAGE_SIZE) - 1);
        if (page > lastPage) setPage(lastPage);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof ApiError ? cause.message : "Something went wrong.",
        );
        setPhotos([]);
        setTotal(0);
        setLoading(false);
      });

    return () => controller.abort();
  }, [offset, page, reloadToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium tracking-tight">Browse</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Full library, newest first. Click a photo to open it full size.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadToken((n) => n + 1)}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300
                     transition hover:bg-neutral-800 hover:text-white"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-500">
        <p>
          {loading ? (
            "Loading…"
          ) : total === 0 ? (
            "0 photos"
          ) : (
            <>
              Showing{" "}
              <span className="tabular-nums text-neutral-300">
                {from}–{to}
              </span>{" "}
              of{" "}
              <span className="tabular-nums text-neutral-300">{total}</span>
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-300
                       transition hover:bg-neutral-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="min-w-20 text-center tabular-nums text-neutral-400">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={loading || page + 1 >= pageCount}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-300
                       transition hover:bg-neutral-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {loading && <GridSkeleton count={12} />}

      {!loading && error && (
        <Notice title="Couldn't load library" tone="error">
          {error}
        </Notice>
      )}

      {!loading && !error && photos.length === 0 && (
        <Notice title="Your library is empty">
          Upload photos on the Upload tab, or index a folder with
          scripts/index_folder.py.
        </Notice>
      )}

      {!loading && !error && photos.length > 0 && (
        <PhotoGrid photos={photos} showScores={false} onSelect={setSelected} />
      )}

      {selected && (
        <Lightbox photo={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
