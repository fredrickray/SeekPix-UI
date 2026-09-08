# SeekPix UI

Frontend for the [SeekPix](../SeekPix) photo search backend. Search your photo
library by describing what's in it.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4

## Running it

The backend must be running first:

```bash
cd ../SeekPix
source .venv/bin/activate
uvicorn api.main:app --port 8000
```

Then start the UI:

```bash
npm install
npm run dev
```

Open the printed URL (http://localhost:5173 unless that port is taken).

### How it talks to the backend

The backend returns relative image URLs such as `/photos/16/thumbnail`, so
`vite.config.ts` proxies the API paths to `http://127.0.0.1:8000`. That lets
`<img src>` use those URLs directly with no rewriting, and avoids CORS in
development. Point it elsewhere with `SEEKPIX_API_URL`:

```bash
SEEKPIX_API_URL=http://127.0.0.1:8080 npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck and build for production |
| `npm run typecheck` | Types only, no build |
| `npm run preview` | Serve the production build |

## Layout

```text
src/
├── api/
│   ├── client.ts      # fetch wrapper + typed endpoint functions
│   └── types.ts       # mirrors the backend response models
├── components/
│   ├── SearchBar.tsx  # debounced query input + example chips
│   ├── PhotoGrid.tsx  # responsive thumbnail grid with scores
│   ├── Lightbox.tsx   # full-size viewer
│   └── States.tsx     # loading skeleton, empty and error notices
├── App.tsx            # Search screen
└── main.tsx
```

## Screens

| Screen | Status |
|--------|--------|
| **Search** | Done — empty query browses recent photos; typing runs semantic search with scores; click opens lightbox |
| **Upload** | Done — drag/drop or file picker, client-side type filter, background job with live progress |
| **Verify** | Done — find appearances in the library, or compare two face photos |
| **Browse** | Done — paginated full library (newest first), refresh, lightbox |

Layout:

```text
src/
├── pages/
│   ├── SearchPage.tsx
│   ├── UploadPage.tsx
│   ├── VerifyPage.tsx
│   └── BrowsePage.tsx
├── api/
├── components/
│   └── ImagePicker.tsx
└── App.tsx               # tab shell (Search | Upload | Verify | Browse)
```

Phase A of the UI (demo screens) is complete against the existing SeekPix API.
