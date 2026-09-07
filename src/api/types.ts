/** Types mirroring the SeekPix backend response models. */

export interface Photo {
  id: number;
  filename: string;
  thumbnail_url: string;
  image_url: string;
  score: number | null;
}

export interface PhotoPage {
  total: number;
  limit: number;
  offset: number;
  items: Photo[];
}

export interface Stats {
  photos: number;
  faces: number;
  clip_vectors: number;
  face_vectors: number;
}

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface Job {
  id: string;
  kind: string;
  status: JobStatus;
  total: number;
  processed: number;
  indexed: number;
  skipped: number;
  failed: number;
  current_file: string | null;
  errors: string[];
  error: string | null;
}

export interface FaceMatch {
  photo: Photo;
  face_id: number;
  score: number;
}

export interface VerifyResult {
  score: number | null;
  matched: boolean | null;
}
