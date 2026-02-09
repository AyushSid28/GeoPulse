# GeoPulse — Phase-by-Phase Build Plan

**Scope:** India only, web only. **Gen AI:** Yes (NL search, status summary, optional assistant).  
**Stack:** Python (FastAPI) backend, React frontend, PWA, LLM API for AI features.  
**Purpose:** Define exactly what we build in each phase so implementation is ordered and measurable.

---

## Indian Rail API — Which One to Use

| API | Purpose | When to use |
|-----|---------|-------------|
| **Live Train Status** | Track **one specific train** by train number + date. Returns: current position, current station, full route with scheduled/actual times, delay. | **Required.** Use this for “where is my train”, map position, ETA, delay. Phase 2+. |
| **Live Station** | List **all trains** at a **station** in the next 2 or 4 hours (arrivals/departures, delays). | **Optional.** Use for “station board” or “what’s at this station” later; not needed for core track-one-train flow. |
| Others (schedule, train between stations, station list, PNR) | Search, static data, PNR status. | Use as needed for ingest (Phase 1) and search. |

**For GeoPulse core:** You need the **Live Train Status** endpoint. Live Station is a nice-to-have for a station-centric view.

---

## Overview

| Phase | Name | Goal |
|-------|------|------|
| **0** | Setup & skeleton | Lock scope, repo structure, Python backend + React frontend, CI. |
| **1** | Data & backend core | DB, static data ingest, train search API, station/route endpoints. |
| **2** | Live track (user not on train) | **Live Train Status** API, live status service, “track train” flow, map with train position. |
| **3** | “I’m on this train” (online) | “I’m on train” UI, device location + backend position on map, snap to route. |
| **4** | **Gen AI** | AI status summary, optional NL search and train assistant (LLM). |
| **5** | Offline & PWA | Service Worker, cache static data, offline search and route on map. |
| **6** | Alerts & polish | “Notify before station”, delay/ETA, rate limiting, README, demo. |

---

## Phase 0 — Setup & Skeleton

**Goal:** Repo and tooling ready; no features yet.

### Backend (Python)

- Create `backend/` (or `services/` as you prefer) with:
  - **FastAPI** app entrypoint (e.g. `main.py` or `app/main.py`).
  - **Virtualenv** (or uv/poetry) and `requirements.txt`: `fastapi`, `uvicorn`, DB driver (`asyncpg`/`psycopg2` or `motor`/`pymongo`), `redis`, `httpx`, `pydantic`, `python-dotenv`.
  - **.env.example** with placeholders: `DATABASE_URL`, `REDIS_URL`, `INDIAN_RAIL_API_KEY`, etc.
  - **Folder layout:** e.g. `app/` or `src/` with `api/`, `services/`, `models/`, `core/` (config).
  - **Health check** route: `GET /health` (and optionally `GET /health/db`, `GET /health/redis`).
  - **CORS** configured for frontend origin.
- **Lint/format:** Ruff (or Black + isort); **tests:** pytest; add a single smoke test (e.g. `GET /health` returns 200).
- **CI:** GitHub Actions (or similar) to run tests and lint on push/PR.

### Frontend (React)

- Create `frontend/` with:
  - **Vite + React** (or Create React App) and TypeScript.
  - **Router:** React Router (one main layout, placeholder pages: Home, Search, Train).
  - **API client:** Axios or fetch wrapper pointing to backend base URL (env var).
  - **Placeholder pages:** Home (title + short description), Search (empty or “Coming soon”), Train (empty).
- **Lint:** ESLint + Prettier; optional Vitest for unit tests.
- **CI:** Run build + lint (and tests if any).

### Repo & Docs

- **README.md:** Project name (GeoPulse), one-line description, scope (India, web), stack (Python FastAPI, React), how to run backend and frontend locally, link to `docs/`.
- **docs/:** Keep `GEOPULSE_ARCHITECTURE_AND_PLANNING.md` and this `GEOPULSE_PHASES.md`.
- **.gitignore:** Python venv, `__pycache__`, `.env`, `node_modules`, build outputs.

### Deliverables (Phase 0)

- [ ] `backend/` runs with `uvicorn`; `GET /health` returns 200.
- [ ] `frontend/` runs with `npm run dev`; shows placeholder pages.
- [ ] CI runs on push (backend tests + lint; frontend build + lint).
- [ ] README explains how to run both.

---

## Phase 1 — Data & Backend Core

**Goal:** Backend has stations and trains (from static data); user can search trains (by number, name, or from–to stations).

### Backend

- **Database:**
  - Choose **PostgreSQL** (with PostGIS for geometry) **or** **MongoDB** (GeoJSON for routes). Define schema/collections:
    - **stations:** id, name, code, lat, lng, (optional) zone.
    - **trains:** id, number, name, type (e.g. express/local/metro).
    - **stop_times:** train_id, station_id, arrival_time, departure_time, sequence, (optional) platform.
    - **routes / route_geometry:** train_id or route_id, polyline or list of [lat, lng]; or segment table (from_station_id, to_station_id, geometry).
  - Migrations or init scripts (e.g. SQL scripts, or Mongo indexes).
- **Data ingest:**
  - Script(s) to fetch **data.gov.in** (Indian Railways timetable, railway stations) or use Indian Rail API “station list” / “train between stations” if available.
  - Normalize and insert into DB: stations first, then trains, then stop_times. Route geometry can be derived later (e.g. from station coordinates as simple polyline) or from API if provided.
  - Document how to run ingest (e.g. `python scripts/ingest_stations.py`, `python scripts/ingest_trains.py`).
- **API:**
  - **GET /api/stations** — list stations (optional query: search by name/code).
  - **GET /api/stations/:id** — station by id (or code).
  - **GET /api/trains** — list/search trains:
    - Query: `?number=12345` or `?name=Rajdhani` or `?from_station_id=...&to_station_id=...`.
    - Response: list of trains with basic info (number, name, type).
  - **GET /api/trains/:id** — train detail + full schedule (stop_times with station names and times).
  - **GET /api/trains/:id/route** — route geometry (polyline) for map; 404 if not yet available (can return simple station-to-station line for Phase 1).
- **Config:** DB URL, Redis URL (optional for Phase 1); no external rail API key required yet for search (static data only).

### Frontend

- **Search page:**
  - Tabs or options: “By train number”, “By train name”, “From station → To station”.
  - “From – To”: two dropdowns (or autocomplete) calling `GET /api/stations`; on submit call `GET /api/trains?from_station_id=...&to_station_id=...`.
  - “By number” / “By name”: input + button; call `GET /api/trains?number=...` or `?name=...`.
  - Show results as a list (train number, name, type); click → navigate to train detail page.
- **Train detail page (basic):**
  - Show train name, number, type; **schedule table** (station name, arrival, departure, sequence) from `GET /api/trains/:id`.
  - No map yet (or static map with route line from `GET /api/trains/:id/route` if available).
- **Navigation:** Home → Search → Train detail; back button.

### Deliverables (Phase 1)

- [ ] DB populated with Indian Railways stations and trains (at least a subset for demo).
- [ ] Search by number, name, and from–to returns correct trains.
- [ ] Train detail page shows schedule.
- [ ] Optional: route polyline on a simple map (e.g. Leaflet) from station coordinates.

---

## Phase 2 — Live Track (User Not on Train)

**Goal:** User can select a train and see its **live position** on a map (from external Indian Rail API), with next station and ETA/delay when API provides it.

### Backend

- **Live status service:**
  - Module that calls **Indian Rail API — Live Train Status** only (not Live Station). Endpoint pattern: `.../livetrainstatus/apikey/<key>/trainnumber/<no>/date/<yyyymmdd>/`. Input: train number + journey date. Output: current position (station or between stations), delay, list of passed/upcoming stops with actual/scheduled times.
  - **Caching:** Store response in Redis with TTL (e.g. 60–120 seconds) to respect API limits and reduce latency.
  - **Fallback:** If API fails, return 503 or cached static schedule so frontend can still show route without live position.
- **API:**
  - **GET /api/trains/:id/live** — query params: `date=YYYY-MM-DD` (default today). Returns: current position (lat/lng if derivable, or last_station/next_station), delay_minutes, next_station, eta_next_station, list of stop updates (actual times). Use live status service + cache.
  - If external API returns only station names (not coordinates), backend derives approximate position from route geometry (e.g. last known station + fraction to next).
- **Rate limiting:** Optional Redis-based rate limit per IP or per API key for `/api/trains/:id/live`.

### Frontend

- **Train detail / track page:**
  - After user selects a train, show **map** (Leaflet or Mapbox) with:
    - **Route polyline** from `GET /api/trains/:id/route`.
    - **Train position** marker from `GET /api/trains/:id/live` (refresh every 30–60 s or manual refresh).
  - **Info panel:** Next station, ETA at next station, delay (if any).
  - **Schedule** (existing) with optional “current position” indicator (e.g. highlight current station).
- **Flow:** Search → select train → “Track train” or direct to track view → map + live marker + panel.

### Deliverables (Phase 2)

- [ ] Backend fetches and caches live train status; returns position (or station-based position) and delay/ETA.
- [ ] Frontend shows train on map with route; updates periodically.
- [ ] Next station and ETA/delay visible.

---

## Phase 3 — “I’m on This Train” (Online)

**Goal:** User can mark “I’m on this train”; app shows **user’s location** (from browser Geolocation) and **train position** (from API) on the same map, with user position snapped to route when possible.

### Backend

- **Optional:** **GET /api/trains/:id/route/snap** — given query param `lat`, `lng`, return nearest point on route polyline (for “snap to track”). Alternatively, snapping can be done entirely on frontend using route GeoJSON.
- No new mandatory endpoints if snapping is client-side.

### Frontend

- **“I’m on this train” entry point:**
  - On train detail/track page, add button: **“I’m on this train”**. On click, set app state (e.g. “onTrain: true” for this train).
- **Location:**
  - Call **Geolocation API** (`navigator.geolocation.watchPosition` or `getCurrentPosition`) when “I’m on this train” is active. Request high accuracy; handle errors (permission denied, timeout).
  - Show **user marker** on map (different icon from train marker).
- **Map:**
  - Display: route polyline, **train marker** (from live API), **user marker** (from Geolocation).
  - Optional: **Snap user to route** — compute nearest point on route polyline to user’s lat/lng; show a second marker or replace user marker with “snapped” position for clearer “on track” UX.
- **Toggle:** “I’m on this train” on/off; when off, hide user location and stop watching position.

### Deliverables (Phase 3)

- [ ] “I’m on this train” mode shows user location and train position on same map.
- [ ] User position updates (Geolocation); train position updates (live API).
- [ ] Optional: user position snapped to route for clarity.

---

## Phase 4 — Gen AI

**Goal:** GeoPulse is a **Gen AI project**: AI summarizes live status in plain language; optional natural-language search and train Q&A assistant.

### Backend

- **AI / NL service:**
  - **LLM integration:** Add dependency (e.g. `openai`, `anthropic`, or client for Ollama). Config: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (or Ollama base URL) in `.env`.
  - **Status summary:** New endpoint **GET /api/trains/:id/live/summary** (or include `summary` in existing live response). Input: same data as live status (position, delay, next station, ETA). Use LLM with prompt: “Summarize for a passenger in 1–2 sentences: delay, next station, ETA. Be concise.” Return plain-language string. Cache with same TTL as live data to avoid extra LLM calls.
  - **Natural language search (optional):** **POST /api/ai/search** — body: `{ "query": "trains from Delhi to Mumbai tomorrow" }`. LLM extracts: from_station (or name), to_station, date. Map to station codes/IDs using stations DB or LLM; then call existing `GET /api/trains?from_station_id=...&to_station_id=...` (and optionally live for one train). Return same shape as structured search + optional short AI caption.
  - **Train assistant (optional):** **POST /api/ai/assistant** — body: `{ "train_id", "message": "When do we reach Bangalore?" }`. Context: train schedule + current live status (from live status service). Prompt: “Answer using only the provided train data. Be brief.” Return assistant reply. Optional: conversation history in session/DB for follow-ups.
- **Rate limiting:** Apply to AI endpoints (e.g. 20 req/min per IP) to control cost and abuse.
- **Fallback:** If LLM fails or times out, return structured data only (no summary); NL search falls back to “Please use the search form” or return empty with message.

### Frontend

- **AI status summary:**
  - On train track page, after live data loads, call **GET /api/trains/:id/live/summary** (or use summary from live response). Display a short “AI summary” card: e.g. “Your train is about 12 minutes late. Next stop: XYZ in ~18 minutes.”
- **Natural language search (optional):**
  - On search page: add “Ask in natural language” input (or voice button). On submit, **POST /api/ai/search** with user text; display results in same list as structured search; optionally show AI caption above results.
- **Train assistant (optional):**
  - On train page: “Ask about this train” — small chat UI (input + messages). **POST /api/ai/assistant** with train_id and message; append assistant reply to thread. Keep last N turns in state or session.

### Deliverables (Phase 4)

- [ ] Backend: LLM integration; **AI status summary** for live train (required for “Gen AI project” angle).
- [ ] Frontend: Summary card on train track page showing plain-language status.
- [ ] Optional: NL search and/or train assistant; rate limiting on AI endpoints.

---

## Phase 5 — Offline & PWA

**Goal:** App works offline for **search** and **viewing route on map** using cached static data; “I’m on train” offline shows **last-known position** + cached route.

### Backend

- **Offline bundle endpoint (optional):**
  - **GET /api/offline/bundle** — returns JSON (or NDJSON) of: stations list (id, name, code, lat, lng), list of trains (id, number, name), and optionally precomputed route geometries for popular trains. Frontend can fetch this when online and store in IndexedDB/cache.
- Alternatively, frontend caches responses from existing endpoints (`/api/stations`, `/api/trains`, `/api/trains/:id`, `/api/trains/:id/route`) via Service Worker.

### Frontend

- **PWA:**
  - **manifest.json:** name, short_name, start_url, display (standalone or minimal-ui), icons.
  - **Service Worker:** Register SW; cache strategy:
    - **Cache-first** for static assets (JS, CSS, icons).
    - **Network-first with cache fallback** for API: `/api/stations`, `/api/trains`, `/api/trains/:id`, `/api/trains/:id/route`. When offline, serve from cache if available.
    - **Network-only** (or short cache) for `/api/trains/:id/live` — when offline, do not show live position; show message “Live position unavailable offline”.
  - **IndexedDB (optional):** Store stations and trains (and routes) for offline search; or rely on Cache API for previously visited train pages.
- **Offline UX:**
  - When offline: show indicator (“You’re offline”); search uses cached data; opening a train page shows cached schedule and route; live position shows “Unavailable offline”.
  - “I’m on this train” offline: use **last-known** device position (from last successful Geolocation before going offline) + cached route; show message “Position may be outdated”.

### Deliverables (Phase 5)

- [ ] App installable as PWA; works offline for search and cached train/route views.
- [ ] Service Worker caches API responses; offline search and route map work from cache.
- [ ] “I’m on train” offline shows last-known position + cached route with clear disclaimer.

---

## Phase 6 — Alerts & Polish

**Goal:** “Notify before station” (or “X min before destination”), consistent delay/ETA display, rate limiting, and README/demo script.

### Backend

- **Alerts (optional but recommended for resume):**
  - **POST /api/alerts** — body: `{ "train_id", "user_id" (or session), "type": "before_station", "station_id", "minutes_before": 10 }`. Store in DB (alerts table).
  - **Background job or in-request check:** When serving live status, if user has alerts for this train, evaluate “train is within X minutes of station Y” and mark alert as triggered; return triggered alerts in response or separate **GET /api/alerts** so frontend can show in-app notification.
  - Simpler variant: no push notifications; only in-app “You’re 10 min from X” when user has “I’m on this train” and alert condition is met.
- **Rate limiting:** Apply to `/api/trains/:id/live` (e.g. 60 req/min per IP) using Redis.
- **Delay/ETA:** Ensure live response and frontend consistently show delay and ETA at next/destination station.

### Frontend

- **Alerts UI:**
  - On train track page: “Set alert” → “Notify me 10 min before [station dropdown]”. Call POST /api/alerts. Show “Alert set” and list of user’s alerts for this train.
  - When live data indicates “train is 10 min from station Y” and user has that alert, show in-app message: “Approaching [station] in ~10 min.”
- **Polish:**
  - Loading states for map and live data; error states (API down, location denied).
  - README: how to run backend + frontend, env vars, how to get Indian Rail API key, scope (India, web), link to architecture and phases docs.
  - Optional: short **demo script** (e.g. “Steps to demo GeoPulse in 2 minutes”) for resume/interview.

### Deliverables (Phase 6)

- [ ] User can set “notify X min before station”; in-app notification when condition is met (or alert returned by API).
- [ ] Rate limiting on live endpoint; delay/ETA shown consistently.
- [ ] README and demo script; app ready for resume/demo.

---

## Summary Table

| Phase | Backend (Python) | Frontend (React) |
|-------|-------------------|------------------|
| **0** | FastAPI app, health, CORS, pytest, CI | Vite+React, router, placeholder pages, CI |
| **1** | DB, ingest (stations, trains, stop_times), GET stations/trains/route | Search (number, name, from–to), train detail + schedule |
| **2** | **Live Train Status** API, live status service + Redis, GET live | Map + route + train marker, next station, ETA/delay |
| **3** | Optional snap-to-route endpoint | “I’m on this train”, Geolocation, user + train on map |
| **4** | **Gen AI:** LLM, status summary, optional NL search + assistant | AI summary card; optional NL search + chat UI |
| **5** | Optional offline bundle | PWA, Service Worker, offline search + route, last-known position |
| **6** | Alerts API, rate limiting, delay/ETA | Alerts UI, polish, README, demo script |

---

*Use this document as the checklist for each phase. Update checkboxes and add sub-items as you implement.*
