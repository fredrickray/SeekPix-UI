import { useState } from "react";
import { ApiError, findSamePerson, verifyFaces } from "../api/client";
import type { FaceMatch, Photo, VerifyResult } from "../api/types";
import ImagePicker from "../components/ImagePicker";
import Lightbox from "../components/Lightbox";
import PhotoGrid from "../components/PhotoGrid";
import { GridSkeleton, Notice } from "../components/States";

type Mode = "find" | "compare";

export default function VerifyPage() {
  const [mode, setMode] = useState<Mode>("find");
  const [probe, setProbe] = useState<File | null>(null);
  const [other, setOther] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<FaceMatch[] | null>(null);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [selected, setSelected] = useState<Photo | null>(null);

  async function runFind() {
    if (!probe || loading) return;
    setLoading(true);
    setError(null);
    setMatches(null);
    setVerify(null);
    try {
      const result = await findSamePerson(probe);
      setMatches(result);
    } catch (cause: unknown) {
      setError(
        cause instanceof ApiError ? cause.message : "Face search failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function runCompare() {
    if (!probe || !other || loading) return;
    setLoading(true);
    setError(null);
    setMatches(null);
    setVerify(null);
    try {
      const result = await verifyFaces(probe, other);
      setVerify(result);
    } catch (cause: unknown) {
      setError(
        cause instanceof ApiError ? cause.message : "Verification failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  const matchPhotos: Photo[] = (() => {
    if (!matches) return [];
    const best = new Map<number, Photo>();
    for (const m of matches) {
      const existing = best.get(m.photo.id);
      if (!existing || (existing.score ?? 0) < m.score) {
        best.set(m.photo.id, { ...m.photo, score: m.score });
      }
    }
    return [...best.values()].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0),
    );
  })();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium tracking-tight">Verify</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Find other photos of the same person, or compare two face photos
          directly.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-neutral-800 bg-neutral-900/40 p-1">
        {(
          [
            { id: "find" as const, label: "Find appearances" },
            { id: "compare" as const, label: "Compare two photos" },
          ] as const
        ).map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id);
                setError(null);
                setMatches(null);
                setVerify(null);
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition
                ${
                  active
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === "find" && (
        <div className="grid gap-6 sm:grid-cols-[minmax(0,240px)_1fr]">
          <div className="space-y-4">
            <ImagePicker
              label="Probe photo"
              file={probe}
              onChange={setProbe}
              disabled={loading}
            />
            <button
              type="button"
              disabled={!probe || loading}
              onClick={runFind}
              className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white
                         transition hover:bg-sky-500 disabled:opacity-40"
            >
              {loading ? "Searching…" : "Find matches"}
            </button>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
              Matches in library
            </h3>

            {loading && <GridSkeleton count={6} />}

            {!loading && error && (
              <Notice title="Couldn't run face search" tone="error">
                {error}
              </Notice>
            )}

            {!loading && !error && matches === null && (
              <Notice title="No search yet">
                Upload a clear face photo, then run Find matches. Results use
                the current face threshold on the backend.
              </Notice>
            )}

            {!loading && !error && matches !== null && matches.length === 0 && (
              <Notice title="No matches above threshold">
                No indexed face scored high enough. Try a clearer photo, or
                expect a looser threshold after calibration.
              </Notice>
            )}

            {!loading && !error && matchPhotos.length > 0 && (
              <PhotoGrid
                photos={matchPhotos}
                showScores
                onSelect={setSelected}
              />
            )}
          </div>
        </div>
      )}

      {mode === "compare" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImagePicker
              label="Photo A"
              file={probe}
              onChange={setProbe}
              disabled={loading}
            />
            <ImagePicker
              label="Photo B"
              file={other}
              onChange={setOther}
              disabled={loading}
            />
          </div>

          <button
            type="button"
            disabled={!probe || !other || loading}
            onClick={runCompare}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white
                       transition hover:bg-sky-500 disabled:opacity-40"
          >
            {loading ? "Comparing…" : "Compare faces"}
          </button>

          {error && (
            <Notice title="Couldn't verify" tone="error">
              {error}
            </Notice>
          )}

          {verify && <VerifyCard result={verify} />}
        </div>
      )}

      {selected && (
        <Lightbox photo={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function VerifyCard({ result }: { result: VerifyResult }) {
  if (result.score === null) {
    return (
      <Notice title="No face detected" tone="error">
        At least one photo had no usable face. Use a clearer, front-facing
        portrait.
      </Notice>
    );
  }

  const matched = result.matched === true;
  const unclear = result.matched === null;

  return (
    <div
      className={`rounded-2xl border px-5 py-6 ${
        matched
          ? "border-emerald-800/70 bg-emerald-950/30"
          : unclear
            ? "border-neutral-800 bg-neutral-900/50"
            : "border-amber-800/60 bg-amber-950/20"
      }`}
    >
      <p className="text-lg font-medium text-neutral-100">
        {matched
          ? "Likely the same person"
          : "Likely different people"}
      </p>
      <p className="mt-2 text-sm text-neutral-400">
        Cosine similarity{" "}
        <span className="tabular-nums text-neutral-200">
          {result.score.toFixed(3)}
        </span>
        . Decision uses the server face-match threshold (currently configured
        in SeekPix <code className="text-neutral-300">.env</code>).
      </p>
    </div>
  );
}
