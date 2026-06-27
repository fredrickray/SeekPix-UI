import type { Photo } from "../api/types";

interface Props {
  photos: Photo[];
  showScores: boolean;
  onSelect: (photo: Photo) => void;
}

export default function PhotoGrid({ photos, showScores, onSelect }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {photos.map((photo, index) => (
        <li key={photo.id}>
          <button
            type="button"
            onClick={() => onSelect(photo)}
            className="group relative block w-full overflow-hidden rounded-xl border border-neutral-800
                       bg-neutral-900 transition hover:border-neutral-600 focus:outline-none
                       focus:ring-2 focus:ring-sky-500/60"
          >
            <img
              src={photo.thumbnail_url}
              alt={photo.filename}
              loading={index < 10 ? "eager" : "lazy"}
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />

            {showScores && photo.score !== null && (
              <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs
                               font-medium tabular-nums text-sky-300 backdrop-blur">
                {photo.score.toFixed(3)}
              </span>
            )}

            <span
              className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent
                         px-2 pb-1.5 pt-6 text-left text-xs text-neutral-300"
              title={photo.filename}
            >
              {photo.filename}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
