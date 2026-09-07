import { useCallback, useState } from "react";
import type { Stats } from "./api/types";
import SearchPage from "./pages/SearchPage";
import UploadPage from "./pages/UploadPage";

type Tab = "search" | "upload";

const TABS: { id: Tab; label: string }[] = [
  { id: "search", label: "Search" },
  { id: "upload", label: "Upload" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("search");
  const [stats, setStats] = useState<Stats | null>(null);

  const onStatsChange = useCallback((next: Stats | null) => {
    setStats(next);
  }, []);

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

        <nav
          aria-label="Primary"
          className="flex gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-1"
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition
                  ${
                    active
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main>
        {tab === "search" && <SearchPage onStatsChange={onStatsChange} />}
        {tab === "upload" && <UploadPage onStatsChange={onStatsChange} />}
      </main>
    </div>
  );
}
