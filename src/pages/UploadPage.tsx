import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { ApiError, getJob, getStats, uploadPhotos } from "../api/client";
import type { Job, Stats } from "../api/types";
import { Notice } from "../components/States";

const ACCEPTED_EXTENSIONS = new Set([
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

const ACCEPT_ATTR = [...ACCEPTED_EXTENSIONS].join(",");

interface Props {
  onStatsChange?: (stats: Stats | null) => void;
}

export default function UploadPage({ onStatsChange }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy =
    submitting || job?.status === "queued" || job?.status === "running";

  // Poll the job until it finishes; refresh library stats on completion.
  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;

    const controller = new AbortController();
    const timer = setInterval(() => {
      getJob(job.id, controller.signal)
        .then((next) => {
          setJob(next);
          if (next.status === "completed" || next.status === "failed") {
            getStats()
              .then((stats) => onStatsChange?.(stats))
              .catch(() => undefined);
          }
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setError(
            cause instanceof ApiError ? cause.message : "Lost contact with job.",
          );
        });
    }, 600);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [job, onStatsChange]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const accepted: File[] = [];
    const skipped: string[] = [];

    for (const file of Array.from(incoming)) {
      const ext = extensionOf(file.name);
      if (!ACCEPTED_EXTENSIONS.has(ext)) {
        skipped.push(file.name);
        continue;
      }
      accepted.push(file);
    }

    setRejected(skipped);
    setError(null);
    setJob(null);
    setFiles((prev) => dedupeByName([...prev, ...accepted]));
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
    },
    [addFiles],
  );

  async function handleUpload() {
    if (!files.length || busy) return;
    setSubmitting(true);
    setError(null);
    try {
      const started = await uploadPhotos(files);
      setJob(started);
      setFiles([]);
    } catch (cause: unknown) {
      setError(
        cause instanceof ApiError ? cause.message : "Upload failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const progress =
    job && job.total > 0 ? Math.min(100, (job.processed / job.total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium tracking-tight">Upload</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Drop photos into the library. They are indexed in the background —
          search becomes available as soon as the job finishes.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed
                    px-6 py-16 text-center transition
                    ${
                      dragging
                        ? "border-sky-500/70 bg-sky-500/5"
                        : "border-neutral-700 bg-neutral-900/40 hover:border-neutral-500"
                    }`}
      >
        <p className="text-base text-neutral-200">
          Drag and drop photos here
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          or click to browse · JPG, PNG, WEBP, HEIC, TIFF
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {rejected.length > 0 && (
        <Notice title="Some files were skipped" tone="error">
          Unsupported type: {rejected.join(", ")}. Videos are not indexed.
        </Notice>
      )}

      {files.length > 0 && (
        <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-300">
              <span className="tabular-nums text-neutral-100">
                {files.length}
              </span>{" "}
              ready to upload
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setFiles([])}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300
                           transition hover:bg-neutral-800 disabled:opacity-40"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleUpload}
                className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white
                           transition hover:bg-sky-500 disabled:opacity-40"
              >
                {submitting ? "Starting…" : "Index photos"}
              </button>
            </div>
          </div>

          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-neutral-400">
            {files.map((file) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 hover:bg-neutral-800/60"
              >
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 tabular-nums text-neutral-600">
                  {formatBytes(file.size)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <Notice title="Upload failed" tone="error">
          {error}
        </Notice>
      )}

      {job && (
        <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-medium text-neutral-200">
              {statusLabel(job)}
            </p>
            <p className="tabular-nums text-neutral-500">
              {job.processed}/{job.total}
            </p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
            <div
              className={`h-full transition-all duration-300 ${
                job.status === "failed" ? "bg-red-500" : "bg-sky-500"
              }`}
              style={{
                width: `${job.status === "queued" ? 4 : progress}%`,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
            <span>
              Indexed{" "}
              <span className="tabular-nums text-neutral-200">
                {job.indexed}
              </span>
            </span>
            <span>
              Skipped{" "}
              <span className="tabular-nums text-neutral-200">
                {job.skipped}
              </span>
            </span>
            <span>
              Failed{" "}
              <span className="tabular-nums text-neutral-200">
                {job.failed}
              </span>
            </span>
            {job.current_file && (
              <span className="truncate text-neutral-500">
                Working on {job.current_file}
              </span>
            )}
          </div>

          {job.errors.length > 0 && (
            <ul className="space-y-1 border-t border-neutral-800 pt-3 text-sm text-red-300/90">
              {job.errors.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          )}

          {job.error && (
            <p className="text-sm text-red-300">{job.error}</p>
          )}

          {job.status === "completed" && (
            <p className="text-sm text-sky-300">
              Done. New photos are searchable from the Search tab.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function dedupeByName(files: File[]): File[] {
  const seen = new Set<string>();
  const out: File[] = [];
  for (const file of files) {
    const key = `${file.name}:${file.size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(file);
  }
  return out;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(job: Job): string {
  switch (job.status) {
    case "queued":
      return "Queued — waiting for a free worker";
    case "running":
      return "Indexing…";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
  }
}
