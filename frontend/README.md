# Doomsday Ready — Frontend

React + Vite frontend. Three views: **Movies**, **Rewatch Plan**, **Booking**.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

Requirements: Node.js 20.19+ (or 22.12+), npm.

## Demo mode vs real backend

`src/services/api.js` has one switch:

```js
export const USE_DEMO_DATA = true;   // true = no backend needed (browser localStorage)
```

- `true` — everything works inside the browser (`src/services/mockBackend.js`). Seed data is the challenge's 8 movies + 4 cinemas. The sidebar has a **Reset demo data** button.
- `false` — the app calls `/api/...` (see `vite.config.js` proxy, default `http://localhost:3000`). Expected endpoints:
  `POST/GET /movies`, `PATCH /movies/:id`, `DELETE /movies/:id` (extra), `GET /movies/:id/rewatch-order`,
  `POST/GET /cinemas`, `GET /cinemas/:id/booking?groupSize=N`.
  If the backend's JSON shape differs, only the `normalize...` functions in `api.js` need changing.
  A `409` with `error: "CIRCULAR_DEPENDENCY"` is shown to the user as a friendly message.

> The cycle check, rewatch order and booking DP in `src/utils/algorithms.js` exist **only to power demo mode**.
> The assessment requires the real logic to be written (and tested) in the backend.

## Features

- Movies: add, edit (title/year/runtime/prerequisites), tick watched, delete, search, filter. Validation: unique title, runtime 1–300, circular dependency blocked (409 `CIRCULAR_DEPENDENCY`).
- Rewatch Plan: pick a target; ordered list (prerequisites first, each once, target excluded), watched ticks (tap to toggle), progress bar ("3 of 7 watched"), remaining watch time.
- Booking: pick a cinema, enter group size (1–10,000), see fewest bundles + breakdown, or "Not possible". Add a new cinema (1–10 different sizes, each 1–500).

## Tests

```bash
npm test
```

Covers the challenge's expected results for rewatch order, cycle detection and booking.

## AI usage

AI assistance was used to scaffold and style the frontend and to draft the demo-mode logic. All code was reviewed and tested by me.
