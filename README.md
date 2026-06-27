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

**Search** is built. An empty query browses recently indexed photos, so the grid
is never blank; typing runs a semantic search and shows relevance scores on each
tile. Clicking a photo opens the full-size image.

Upload, Verify, and Browse are not built yet. The backend already exposes
everything they need (`POST /photos/upload` with `GET /jobs/{id}` for progress,
`POST /faces/find`, `POST /faces/verify`, and paginated `GET /photos`), and
`src/api/client.ts` already wraps upload and job polling.
