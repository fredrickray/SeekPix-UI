import type { FaceMatch, Job, Photo, PhotoPage, Stats, VerifyResult } from "./types";

/** Raised for any non-2xx backend response, carrying a readable message. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError(
      "Cannot reach the SeekPix backend. Is it running on port 8000?",
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(await readErrorDetail(response), response.status);
  }
  return (await response.json()) as T;
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
  } catch {
    // fall through to the generic message
  }
  return `Request failed with status ${response.status}`;
}

export function getStats(signal?: AbortSignal): Promise<Stats> {
  return request<Stats>("/stats", { signal });
}

export function listPhotos(
  { limit = 60, offset = 0 }: { limit?: number; offset?: number } = {},
  signal?: AbortSignal,
): Promise<PhotoPage> {
  return request<PhotoPage>(`/photos?limit=${limit}&offset=${offset}`, {
    signal,
  });
}

export function searchPhotos(
  query: string,
  topK = 24,
  signal?: AbortSignal,
): Promise<Photo[]> {
  return request<Photo[]>("/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK }),
    signal,
  });
}

export function uploadPhotos(files: File[]): Promise<Job> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  return request<Job>("/photos/upload", { method: "POST", body: form });
}

export function getJob(id: string, signal?: AbortSignal): Promise<Job> {
  return request<Job>(`/jobs/${id}`, { signal });
}

export function findSamePerson(
  file: File,
  { topK = 20 }: { topK?: number } = {},
  signal?: AbortSignal,
): Promise<FaceMatch[]> {
  const form = new FormData();
  form.append("file", file);
  return request<FaceMatch[]>(`/faces/find?top_k=${topK}`, {
    method: "POST",
    body: form,
    signal,
  });
}

export function verifyFaces(
  fileA: File,
  fileB: File,
  signal?: AbortSignal,
): Promise<VerifyResult> {
  const form = new FormData();
  form.append("file_a", fileA);
  form.append("file_b", fileB);
  return request<VerifyResult>("/faces/verify", {
    method: "POST",
    body: form,
    signal,
  });
}
