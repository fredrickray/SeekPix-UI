import { useCallback, useEffect, useState } from "react";
import { ApiError, getStats, listPhotos, searchPhotos } from "./api/client";
import type { Photo, Stats } from "./api/types";
import Lightbox from "./components/Lightbox";
import PhotoGrid from "./components/PhotoGrid";
import SearchBar from "./components/SearchBar";
import { GridSkeleton, Notice } from "./components/States";

export default function App() {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Photo | null>(null);

  const isSearching = query.trim().length > 0;

  useEffect(() => {
    const controller = new AbortController();
    getStats(controller.signal)
      .then(setStats)
      .catch(() => setStats(null));
    return () => controller.abort();
  }, []);

  // One effect drives both modes: an empty query browses the library instead of
  // searching, so the grid is never blank on first load.
  useEffect(() => {
    const controller = new AbortController();
    const trimmed = query.trim();

    setLoading(true);
    setError(null);

    const load = trimmed
      ? searchPhotos(trimmed, 24, controller.signal)
      : listPhotos({ limit: 30 }, controller.signal).then((page) => page.items);

    load
      .then((result) => {
        setPhotos(result);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof ApiError ? cause.message : "Something went wrong.",
        );
        setPhotos([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  const handleQueryChange = useCallback((next: string) => setQuery(next), []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">SeekPix</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Search your photo library by describing what's in it.
            </p>
          </div>
          {stats && (
            <p className="text-sm text-neutral-500">
              <span className="tabular-nums text-neutral-300">
                {stats.photos}
              </span>{" "}
              photos ·{" "}
              <span className="tabular-nums text-neutral-300">
                {stats.faces}
              </span>{" "}
              faces indexed
            </p>
          )}
        </div>

        <SearchBar
          value={query}
          onChange={handleQueryChange}
          busy={loading && isSearching}
        />
      </header>

      <main>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
          {isSearching ? `Results for “${query.trim()}”` : "Recently indexed"}
        </h2>

        {loading && <GridSkeleton />}

        {!loading && error && (
          <Notice title="Couldn't load photos" tone="error">
            {error}
          </Notice>
        )}

        {!loading && !error && photos.length === 0 && (
          <Notice
            title={isSearching ? "No matches" : "Your library is empty"}
          >
            {isSearching
              ? "Nothing in the library resembles that description. Try different wording."
              : "Index a folder with scripts/index_folder.py, then reload."}
          </Notice>
        )}

        {!loading && !error && photos.length > 0 && (
          <PhotoGrid
            photos={photos}
            showScores={isSearching}
            onSelect={setSelected}
          />
        )}
      </main>

      {selected && (
        <Lightbox photo={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
