import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
}

const EXAMPLES = ["a person smiling", "food", "screenshot of text", "outdoors"];

export default function SearchBar({ value, onChange, busy }: Props) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);

  // Debounced so typing doesn't fire a CLIP embedding per keystroke.
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), 350);
    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
          {busy ? <Spinner /> : <SearchIcon />}
        </span>
        <input
          ref={inputRef}
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Describe what you remember — “red car”, “birthday cake”…"
          aria-label="Search photos by description"
          className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/80 py-4 pl-12 pr-4 text-base
                     text-neutral-100 placeholder:text-neutral-500 shadow-lg shadow-black/30 outline-none
                     transition focus:border-sky-500/60 focus:ring-4 focus:ring-sky-500/10"
        />
        {draft && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm text-neutral-500
                       transition hover:bg-neutral-800 hover:text-neutral-200"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-neutral-500">Try:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onChange(example)}
            className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-300
                       transition hover:border-neutral-700 hover:text-white"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
