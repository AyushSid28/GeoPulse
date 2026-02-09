# GeoPulse — Architecture, Requirements & Planning

**Version:** 1.1  
**Scope:** **India only**, **web only**.  
**Purpose:** Full planning document for a “Where is my train”–style app: real-time train tracking with support for **user on train** (device location when online; offline static data) and **user not on train** (tracking by train number/route). No implementation yet — architecture and requirements only.

---

## One-Page Summary

| Aspect | Summary |
|--------|--------|
| **What** | Train tracking app (India): “Where is that train?” and “Where am I on this train?” |
| **Scope** | **India only.** **Web only** (React PWA; no native app). |
| **Data sources** | External Indian rail API (live status), device Geolocation (GPS/Wi‑Fi), offline timetable + route cache. |
| **Two modes** | (1) User not on train → backend/API position on map. (2) User on train → device location and/or API; offline = cached route + last-known position. |
| **Tech stack** | **Frontend:** React PWA (Mapbox or Leaflet). **Backend:** Python (FastAPI). DB: PostgreSQL or MongoDB; Redis cache. Indian Rail API + data.gov.in. **Gen AI:** LLM for NL search, status summary, optional assistant. |
| **Indian Rail API** | **Primary:** Live Train Status (track one train: position, delay, ETA). **Optional:** Live Station (trains at a station in next 2/4 h). |
| **Web limitation** | Browser does not expose cell IDs; “on train” location uses Geolocation API only (no cell-tower fallback on web). |
| **Phases** | See **GEOPULSE_PHASES.md** for detailed phase-by-phase build plan (includes Gen AI phase). |
| **Agent use** | Scaffolding, API integration, data pipeline, map UI, offline strategy, Gen AI prompts/flows, tests, docs. |

---

## 1. Product Vision & Problem Statement

### 1.1 What We’re Building

- **GeoPulse** is a **India-only, web-only** train-tracking product that:
  - Shows **live position** of a train on a map (Indian Railways).
  - Works in **two modes**:
    - **Mode A — User ON the train:** App knows user is on a specific train and shows “where am I” using device location (browser Geolocation API when online; cached route + last-known position when offline).
    - **Mode B — User NOT on the train:** User searches by train number/name or station pair and tracks that train’s live position (no device location required).
  - Provides **schedule, delays, next station, ETA**, and optional **alerts** (e.g. “10 min to destination”).
  - **Web only:** No native app; cell-tower–based location is not in scope (browser does not expose cell IDs).

### 1.2 Why “Where is my train”–style?

- **Where is my train** (and similar apps) are known for:
  - Working **without internet** for basic location (using cell towers + offline data).
  - Using **signaling / backend data** when available for accurate train position.
  - **Offline timetables** so users can search trains and see schedule even in bad connectivity.

We want GeoPulse to have a **clearly defined architecture** that supports the same ideas: multiple data sources, offline-capable design, and both “me on train” and “that train” use cases.

---

## 2. Research Summary: How Train Tracking Actually Works

### 2.1 “Where is my train” (and similar apps)

- **Cell tower–based location:** When the user is on the train, the app can use **cell tower IDs** (e.g. MCC, MNC, LAC, Cell ID) to get an approximate position **without GPS and without internet**, by matching to a pre-downloaded or cached **cell-tower → coordinates** database (e.g. OpenCelliD, Mozilla Location Service).
- **Signaling / backend data:** Where railways or third parties expose **live train position** (from signaling systems or official APIs), the app shows that as the primary “train position” (more accurate than a single phone’s location).
- **Offline timetables:** Schedules, station list, and route geometry are stored **on device** so search and route display work offline.

So the “magic” is: **cell towers + offline DB** for “where am I” when on train; **APIs / signaling** for “where is that train” and for better accuracy when online.

### 2.2 Data Sources (generic)

| Source type              | What it gives                          | When used                          |
|--------------------------|----------------------------------------|------------------------------------|
| **Railway / 3rd‑party API** | Live train status, position, delays    | User not on train; backend position |
| **Cell tower DB**        | (MCC, MNC, LAC, Cell ID) → lat/lng     | User on train, no GPS / offline    |
| **GPS / device location**| User’s lat/lng                         | User on train, when GPS available  |
| **Static schedules**     | Timetables, routes, stations           | Search, ETAs, offline              |
| **Crowdsourced position**| Optional: passengers report position  | Enhance accuracy (like RailRadar)  |

### 2.3 Indian context (for resume / demo)

- **APIs:** Indian Rail API (e.g. indianrailapi.com) — Live Train Status, PNR, station, schedule. RailRadar-style platforms use **crowdsourced GPS** and schedules; some have REST APIs.
- **Open data:** data.gov.in — Indian Railways train timetable, railway station datasets (not GTFS, but usable for routes/stations).
- **Cell tower → location:** **OpenCelliD** (Unwired Labs), **Mozilla Location Service** — convert cell IDs to coordinates; need API key or offline dump for true “works without internet” on train.
- **Browser vs native:** Standard **web Geolocation API** does **not** expose raw cell IDs; it only returns coordinates (browser/OS does the resolution). So **true cell-tower–based “offline” location** typically needs **native** (e.g. Android TelephonyManager) or a **hybrid** (native module + web UI).

---

## 3. High-Level Architecture

### 3.1 Core Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GEOPULSE — HIGH LEVEL FLOWS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FLOW 1: User NOT on train (track a train)                                   │
│  ───────────────────────────────────────                                    │
│  User → Search (train no. / name / from–to) → Backend → External Rail API   │
│       → Live position + schedule + delays → Map + ETA + next station         │
│  Data: 100% from our backend + external APIs (no device location needed)     │
│                                                                              │
│  FLOW 2: User ON train — with internet                                       │
│  ───────────────────────────────────────                                    │
│  User selects train + “I’m on this train”                                    │
│  Option A: Use backend train position (if API gives it) → show on map       │
│  Option B: Use device location (GPS/Wi‑Fi) → show “you are here” on route    │
│  Option C: Fuse both (e.g. snap device to route + show train position)      │
│                                                                              │
│  FLOW 3: User ON train — low / no internet (offline‑first)                   │
│  ───────────────────────────────────────────────────────                    │
│  • Device has: offline timetable + route geometry + cell-tower DB (or        │
│    precomputed “cell → segment” cache).                                      │
│  • App gets: Cell IDs from device (native) or last-known GPS (web fallback)  │
│  • Resolve: Cell IDs → approximate position → snap to route → show segment   │
│  • When back online: sync and optionally report position (crowdsource).      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 System Context (actors and systems)

```
                    ┌──────────────┐
                    │   User       │
                    │ (Web only)   │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌──────────────────┐      ┌──────────────────────┐
    │ GeoPulse         │      │ GeoPulse Backend      │
    │ Frontend         │      │ (Python / FastAPI)   │
    │ (React PWA)      │      │ Auth, proxy, cache    │
    └────────┬─────────┘      └──────────┬───────────┘
             │                           │
             ▼                           ▼
    ┌──────────────────┐      ┌──────────────────────┐
    │ Device location  │      │ External Rail APIs   │
    │ (GPS / Wi‑Fi)    │      │ (Live status, etc.)  │
    └──────────────────┘      └──────────────────────┘
```

---

## 4. Functional Requirements (Structured)

### 4.1 Must-have (MVP)

- **Train search**
  - By train number, train name, or “from station → to station”.
  - Results: list of matching trains with basic schedule (from static/semi-static data or API).
- **Track a train (user not on train)**
  - Show selected train’s **current position** on a map (from API when available).
  - Show **next station**, **ETA**, **delay** (if API provides).
- **“I’m on this train” (user on train)**
  - User selects a train and marks “I’m on this train”.
  - **With internet:** Show train position (from API) and/or user’s location (from device) on the same map/route.
  - **With internet:** Prefer backend train position when available; optionally show user’s location snapped to route.
- **Static data offline**
  - Offline-capable **station list**, **train list** (or subset), **route geometry** for selected routes so that at least search and route display work without network (PWA + Service Worker + cache).
- **Backend**
  - Auth (e.g. optional login), API to proxy/cache external rail APIs, serve static data (stations, routes).
- **Map**
  - Map view with route polyline and train position (and optionally user position).

### 4.2 Should-have (V1)

- **“On train” location (web):** Use browser Geolocation API (high or low accuracy); snap position to route; when offline, show last-known position + cached route.
- **Alerts**
  - “Notify me X minutes before station Y” or “when train is 5 km from destination”.
- **Delay and ETA**
  - Display delay and ETA at next/destination station (from live API when available).
- **Caching and rate limiting**
  - Backend caches external API responses; respects rate limits and handles API downtime.

### 4.3 Could-have (later)

- **Trip history / saved trains** — Save frequently tracked trains; show recent trips.
- **Crowdsourced position** — Optional: anonymous position reports to improve train position when API is laggy (India-only, web-only scope unchanged).
- **GTFS export** — If we normalize our data, optionally publish GTFS for compatibility (India does not provide official GTFS; we could export our own).

---

## 5. Non-Functional Requirements

- **Latency:** Train position (when from API) should feel “live” (e.g. refresh every 30–60 s; configurable).
- **Offline:** Static search and route display work offline (PWA cache); “on train” offline = cached route + last-known device position (web cannot use cell-tower).
- **Scalability:** Backend stateless; cache external APIs; optional queue for crowdsourced updates.
- **Security:** No API keys in frontend; auth for optional user features; HTTPS only.
- **Resume/demo:** Clear README and docs; one region (e.g. Indian Railways) is enough to showcase architecture.

---

## 6. Data Model (Conceptual)

- **Train:** train_id, number, name, type (local/metro/express), schedule (list of stop_times), route_geometry (polyline or segment list).
- **Station:** station_id, name, code, lat, lng, zone/region.
- **Stop_time:** train_id, station_id, arrival, departure, sequence, platform (optional).
- **Live_train_status:** train_id, journey_date, current_station_or_segment, delay_minutes, last_updated, source (api/crowdsource).
- **Route_segment:** segment_id, from_station_id, to_station_id, geometry (linestring), order.
- **User_trip** (optional): user_id, train_id, started_at, “on train” flag; for “I’m on this train” and alerts.

(Exact schema and DB choice — e.g. PostgreSQL/PostGIS, MongoDB — to be decided in implementation phase.)

---

## 7. Tech Stack (Locked)

**Scope: India only, web only.**

### 7.1 Frontend

- **React** — SPA; optional Next.js if you want SSR/SSG later.
- **PWA** — Service Worker, Cache API, optional IndexedDB for offline static data (stations, trains, route geometry).
- **Map:** Mapbox GL JS or Leaflet + OpenStreetMap tiles.
- **State:** React state + React Query (or SWR) for server state; optional Zustand/Context for “I’m on this train” and map state.

### 7.2 Backend

- **Python** — **FastAPI** for REST API (async, OpenAPI, good for resume).
- **Database:** PostgreSQL (with PostGIS for geometry) or MongoDB (GeoJSON); choose one for stations, routes, stop_times, live cache.
- **Cache:** Redis for external API response cache and rate limiting.
- **Auth:** JWT or session-based; optional OAuth (Google) for “my trips” and alerts.
- **Jobs:** Optional Celery (or FastAPI BackgroundTasks) for periodic refresh of external API and cache warming.

### 7.3 External & Data

- **Indian Rail API (indianrailapi.com)** — which endpoints we use:
  - **Live Train Status (required):** `GET .../livetrainstatus/.../trainnumber/<no>/date/<yyyymmdd>/` — track a **specific train** by number + date. Returns: current position, current station, full route with scheduled/actual times, delay. This is the **primary API** for “where is my train”, map position, and ETA/delay. Use this for Phase 2+.
  - **Live Station (optional):** `GET .../LiveStation/.../StationCode/<code>/hours/<2|4>/` — list **all trains** arriving/departing at a **station** in the next 2 or 4 hours (train names, numbers, scheduled/expected times, delays). Use for “station board” or “what’s at this station” later; not required for core track-one-train flow.
  - Other endpoints (train schedule, train between stations, station list, PNR) can be used for ingest and search as needed; see provider docs.
- **Maps:** Mapbox (API key) or OpenStreetMap (free) for tiles; route polyline and markers on top.
- **Static data:** data.gov.in (Indian Railways timetable, stations); transform and seed DB. No cell-tower DB (web-only).

### 7.4 DevOps & Quality

- **API:** REST (FastAPI); optional WebSocket or SSE for live position push later.
- **CI/CD:** GitHub Actions; run tests (pytest) and lint (Ruff/Black).
- **Monitoring:** Logging (structlog or standard library); optional APM.

---

## 7.5 Gen AI / AI Features (GeoPulse as a Gen AI Project)

GeoPulse is positioned as a **Gen AI–enabled** train-tracking app: AI is used to make queries natural and answers human-friendly.

### Where AI Fits

| Use case | Description | Tech |
|----------|-------------|------|
| **Natural language search** | User types or speaks: “trains from Delhi to Mumbai tomorrow”, “is 12345 on time?” → system parses intent (from_station, to_station, date; or train number + “status”) and calls existing search/live APIs. | LLM (e.g. OpenAI/Anthropic or open model) for intent + slot extraction; backend maps to `GET /api/trains`, `GET /api/trains/:id/live`. |
| **Live status in plain language** | Instead of raw “Delay: 12 min, Next: XYZ”, show: “Your train is about **12 minutes late**. Next stop: **XYZ** in approximately **18 minutes**.” | Backend: take live status JSON → prompt LLM to summarize in one or two short sentences (with numbers preserved); or template-based with LLM for tone. |
| **Train assistant / chatbot** | User asks: “When do we reach Bangalore?”, “Why is it delayed?” — app answers using current train data (schedule + live status). | Backend: chat endpoint; context = train + live status; LLM generates answer grounded in that context. Optional: short conversation history. |
| **Optional: voice search** | User speaks “trains from Howrah to Sealdah” → speech-to-text (browser or API) → same NL search pipeline. | Web Speech API or cloud STT; then same NL parsing as above. |

### Implementation Approach

- **Backend:** Add an **AI service** (or “NL service”) that:
  - Calls LLM API (OpenAI, Anthropic, or open model via Ollama/Replicate) with strict prompts and structured output (e.g. JSON: `{ "intent": "search_trains", "from_station": "DEL", "to_station": "BOM", "date": "2025-02-09" }`).
  - For **NL search:** Parse user message → call Train service / Live status service with extracted params → return results (and optionally a short AI-generated caption).
  - For **status summary:** Input = live status JSON; prompt = “Summarize in one sentence for a passenger, include delay and next station and ETA”; output = plain-language string.
  - For **assistant:** Input = user message + context (train info + live status); prompt = “Answer only using the provided train data”; output = short reply. Use **RAG-style** context (inject train/live data into prompt), not full retrieval.
- **Frontend:** 
  - **Search:** Optional “Ask in natural language” box (or voice button) that sends text to `POST /api/ai/search` (or `/api/ai/query`); display results same as structured search.
  - **Train page:** “Summary” or “Ask about this train” — show AI summary of live status and/or a small chat for Q&A about this train.
- **Safety / cost:** No PII in prompts; rate limit AI endpoints; optional fallback to structured search if LLM fails; use small/fast models where possible to keep latency and cost low.

### Resume / Demo Angle

- “Gen AI–powered train tracking: natural language search and human-readable status summaries.”
- One clear AI feature for MVP (e.g. **AI status summary** on the train page); add **NL search** and **assistant** in a dedicated phase so the project clearly showcases Gen AI.

---

## 8. Component Architecture (Backend)

- **Auth service:** Login, JWT issue/validate, optional “my trips” and alerts (you already have auth-service stub).
- **Train service:** Train search (by number, name, from–to); returns list and schedule from DB + optional live status from external API.
- **Live status service:** Fetches/caches **Indian Rail API — Live Train Status** (train number + date); returns current position, delay, next station; used by “track train” and “I’m on train” (when online). Do **not** use Live Station for this; Live Station is for station-centric views only.
- **Static data service:** Stations, routes, route geometry; used for search, map, and offline bundle generation.
- **AI / NL service (Gen AI):** Parses natural language queries (search, “is my train on time?”), generates plain-language status summaries from live JSON, and optional train Q&A; calls LLM API with structured prompts and context (train + live data).
- **Alerts service (optional):** Store user alert rules; when live data updates, evaluate and push (e.g. in-app or push notification). No server-side cell resolution (web-only).

---

## 9. Agent Involvement (How AI / Cursor Can Help)

- **Scaffolding:** Generate service stubs (train, live status, static data, location), API routes, and DTOs from this doc.
- **Integration:** Implement external API client (Indian Rail API or mock), error handling, retries, and caching.
- **Data pipeline:** Scripts to fetch data.gov.in (or similar) and normalize into trains, stations, stop_times, route geometry.
- **Frontend:** Map component (route polyline, train marker, user marker); search UI; “I’m on this train” flow; PWA manifest and Service Worker.
- **Offline:** Design cache strategy (what to preload, when to invalidate); implement Service Worker and cache/IndexedDB for static data.
- **Testing:** Backend: pytest (unit + integration). Frontend: React Testing Library; optional E2E (Playwright/Cypress) for search → select train → map.
- **Docs:** Keep this doc updated; add API.md and RUNBOOK.md when you start coding.

---

## 10. Implementation Phases

Detailed phase-by-phase build plan is in **`GEOPULSE_PHASES.md`**. Summary:

| Phase | Focus |
|-------|--------|
| **0** | Scope & stack (India, web, Python + React); repo and CI. |
| **1** | Data & backend core: DB, ingest, train/static services, search API. |
| **2** | Live position (user not on train): **Live Train Status** API, “track train” + map. |
| **3** | “I’m on this train” (online): device location + backend position on map. |
| **4** | **Gen AI:** AI status summary, optional NL search and train assistant. |
| **5** | Offline & PWA: Service Worker, cache, offline search and route. |
| **6** | Alerts & polish: “notify before station”, delay/ETA, rate limiting, README. |

(Cell-tower phase omitted — web-only; browser does not expose cell IDs.)

---

## 11. Risks & Mitigations

- **External API limits/deprecation:** Use caching and fallback to static schedule; abstract API behind our “live status” service so we can swap provider.
- **Cell-tower accuracy:** Set user expectation (“approximate position”); prefer backend train position when online; use cell only as fallback.
- **No official GTFS for India:** Use custom schema and data.gov.in / third-party APIs; optional GTFS export for our data later.
- **Offline “on train” on web:** Browser doesn’t expose cell IDs; we rely on cached route + last-known Geolocation position when offline; document this limitation.

---

## 12. Success Criteria (for resume / demo)

- User can **search** trains (by number or from–to) and **see live position on a map** when backend API is available.
- User can say **“I’m on this train”** and see **their location** (and/or train position) on the **route** on a map.
- **Offline:** User can open app, search (cached data), and see **route on map**; “on train” with cached route + last-known device position.
- Architecture doc (this) and README clearly explain **data sources**, **two modes** (on train / not on train), and **India-only, web-only** scope.

---

## 13. Next Steps (No Code Yet)

1. **Scope locked:** India only, web only; Python (FastAPI) backend, React frontend. See **GEOPULSE_PHASES.md** for what we build each phase.
2. **Get API keys:** Indian Rail API (indianrailapi.com — **Live Train Status** is the one needed for tracking; optional: Live Station for station board), Mapbox (or OSM-only). For Gen AI: OpenAI or Anthropic (or Ollama for local).
3. **Set up repo structure:** e.g. `backend/` (Python), `frontend/` (React), `docs/` (this + phases).
4. **Phase 0:** Create project skeleton (FastAPI app, React app, DB + Redis placeholders, CI), then start Phase 1.

---

*This document is the single source of truth for GeoPulse architecture and planning. Update it as you make implementation decisions.*
