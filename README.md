# Company Notes

Full-stack app that lists companies, lets you add/edit/delete notes (public or private), and generates AI summaries. Frontend is reusable, backend is Express with Firestore as the source of truth for companies and notes (JSON fallback for notes only if Firestore is not configured). The App display companies, let adding/viewing/deleting notes, AI summaries using gpt-4o for fast and reliable output, edit notes with privacy toggle, sectors and companies filter, Firebase auth (using google sign-in), loading states, unit tests with vitest (store), and responsive UI.

## Project structure

```
	app/                        # Using Next.js App Router For later ssr implementation
		page.tsx                  # main page logic, data fetching, state
		layout.tsx                # global metadata/layout
		globals.css               # theme and base styles (tried to match the current Fisher tec homepage guidelines)
		components/               #
			HeroSection.tsx         # hero + search input
			FiltersBar.tsx          # sector filters + counts
			CompanyCard.tsx         # company detail, notes, summary CTA
			AuthPreferencesCard.tsx # auth + language toggle
			ui.tsx                  # Spinner etc.
		lib/translations.ts       #  EN/HE
	lib/firebase.ts             # client Firebase auth singleton
	data/notes.json             # local notes storage fallback
	server/                     # Express API
		index.ts                  # routes, auth, summaries
		store.ts                  # data access (JSON or Firestore)
		store.test.ts             # vitest coverage for store
	public/                     # assets
	next.config.ts              # externalDir enabled to import ../types.ts
	tsconfig*.json              # TS configs (web + server)
```

### Frontend reusability

- Components are prop-driven and stateless where possible (e.g., `CompanyCard`, `FiltersBar`).
- Shared UI primitives (`ui.tsx`, pills/buttons styles in `globals.css`) keep styling consistent.
- Copy/locale is centralized in `lib/translations.ts` (English + Hebrew, RTL aware).
- Firebase auth is wrapped in `lib/firebase.ts` so auth provider swaps are isolated.
- `page.tsx` holds orchestration only (fetching, state, handlers); pure rendering lives in components for reuse.

### Backend functionality

- Express server (`server/index.ts`) with CORS + JSON body parsing.
- Auth: verifies Firebase ID tokens when provided; in dev you can bypass with `ALLOW_DEV_AUTH_BYPASS=true` and header `x-user-id`.
- Routes:
  - `GET /companies` — gets companies list from Firestore (auth required).
  - `GET /companies/:id/notes` — returns public notes + caller's private notes.
  - `POST /notes` — create note `{ companyId, content, isPrivate }` (auth required).
  - `PUT /notes/:id` — update note you own.
  - `DELETE /notes/:id` — delete note you own.
  - `POST /summaries` — OpenAI call (2–3 sentence summary) using server-side key only.
- Storage (`server/store.ts`):
  - Companies are always read from Firestore `companies` collection (numeric `id` field or doc id convertible to number). If Firestore is not configured, the route will error so you know to set it up.
  - Notes: If `FIREBASE_SERVICE_ACCOUNT` is set and `firebase-admin` is initialized, notes are stored in Firestore collection `notes`. Otherwise falls back to JSON file `data/notes.json` (created if missing) for local/dev only.
- Tests: `server/store.test.ts` (vitest) covers create/update/delete and privacy filtering.

## Setup

```bash
npm install
npm run dev            # runs Next (3000) + API (4000) together
```

### Environment variables

```
OPENAI_API_KEY=...                 # required for /summaries
PORT=4000                          # Express port
CORS_ORIGIN=http://localhost:3000
ALLOW_DEV_AUTH_BYPASS=true         # dev-only convenience
FIREBASE_SERVICE_ACCOUNT={...}     # JSON for firebase-admin (needed for Firestore)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
```

If you omit `FIREBASE_SERVICE_ACCOUNT`, notes are saved to `data/notes.json` (dev fallback only) and companies will fail to load until Firestore is configured. With it set, notes are saved to Firestore (`notes` collection) and include fields: `id`, `companyId`, `content`, `createdAt` (ISO string), `isPrivate` (bool), `userId` (string). Companies are read from `companies` collection with the same `id` expectation.

## Running

- `npm run dev` — Next + API concurrently
- `npm run dev:web` — Next only
- `npm run dev:server` — API only (tsx)
- `npm test` — vitest store tests
- `npm run lint` — ESLint

## Feature coverage (from assignment)

- Display companies (grid/list) using Firestore `companies` collection (required)
- Add/View/Delete notes, Edit notes, Private/Public toggle
- AI Summary button per company (backend OpenAI call only)
- Filter companies by sector
- Authentication via Firebase Auth (Google; optional guest in dev with bypass)
- Loading states (companies, notes, summaries)
- Unit tests (store)
- Responsive design (cards/grid, mobile-friendly)

## Error handling

- API returns 4xx for invalid input/unauthorized; 5xx for server/LLM errors.
- UI shows inline errors (`apiError`) with a snackbar, and disables actions while saving.
- Server validates ownership before update/delete and requires auth for write operations.

## Notes

- Keep `companies.json` untouched as required.
- Do not expose `OPENAI_API_KEY` to the client; all LLM calls run on the server.
- For Firestore testing, you can manually seed documents in collection `notes` matching the fields above.
