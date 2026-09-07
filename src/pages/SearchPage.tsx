import { useCallback, useEffect, useState } from "react";
import { ApiError, getStats, listPhotos, searchPhotos } from "../api/client";
import type { Photo, Stats } from "../api/types";
import Lightbox from "../components/Lightbox";
import PhotoGrid from "../components/PhotoGrid";
import SearchBar from "../components/SearchBar";
import { GridSkeleton, Notice } from "../components/States";

interface Props {
  onStatsChange?: (stats: Stats | null) => void;
}

export default function SearchPage({ onStatsChange }: Props) {
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
      .then((next) => {
        setStats(next);
        onStatsChange?.(next);
      })
      .catch(() => {
        setStats(null);
        onStatsChange?.(null);
      });
    return () => controller.abort();
  }, [onStatsChange]);

  // Empty query browses recent photos so the grid is never blank on first load.
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
    <>
      <div className="mb-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium tracking-tight">Search</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Describe what you remember — no tags or filenames needed.
          </p>
        </div>

        <SearchBar
          value={query}
          onChange={handleQueryChange}
          busy={loading && isSearching}
        />
      </div>

      <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
        {isSearching ? `Results for “${query.trim()}”` : "Recently indexed"}
        {stats && !isSearching && (
          <span className="ml-2 normal-case tracking-normal text-neutral-600">
            · {stats.photos} photos
          </span>
        )}
      </h3>

      {loading && <GridSkeleton />}

      {!loading && error && (
        <Notice title="Couldn't load photos" tone="error">
          {error}
        </Notice>
      )}

      {!loading && !error && photos.length === 0 && (
        <Notice title={isSearching ? "No matches" : "Your library is empty"}>
          {isSearching
            ? "Nothing in the library resembles that description. Try different wording."
            : "Upload photos on the Upload tab, or index a folder with scripts/index_folder.py."}
        </Notice>
      )}

      {!loading && !error && photos.length > 0 && (
        <PhotoGrid
          photos={photos}
          showScores={isSearching}
          onSelect={setSelected}
        />
      )}

      {selected && (
        <Lightbox photo={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
