# GeoPulse Frontend — Complete Plan

**Stack:** React 19 + TypeScript, Vite, Tailwind CSS, Leaflet, TanStack Query, Zustand  
**Design:** Mobile-first, dark blue theme, professional grade, deployed for real users

---

## Tech Stack

| Package | Purpose |
|---|---|
| `react-router-dom` | Client-side routing |
| `tailwindcss` + `@tailwindcss/vite` | Utility-first CSS |
| `react-leaflet` + `leaflet` | Map (free, OpenStreetMap tiles) |
| `@tanstack/react-query` | Server state, caching, auto-refetch |
| `zustand` | Client state (on-train mode, user prefs) |
| `lucide-react` | Icons |
| `axios` | API client |
| `vite-plugin-pwa` | PWA + Service Worker |

---

## Design System

### Color Palette

| Token | Hex | Use |
|---|---|---|
| Primary | `#1e3a8a` (blue-900) | Headers, nav, primary buttons |
| Primary Light | `#3b82f6` (blue-500) | Links, active states, route line |
| Accent | `#f59e0b` (amber-500) | Delay badges, warnings |
| Success | `#10b981` (emerald-500) | "On time" badge |
| Danger | `#ef4444` (red-500) | Severe delay, errors |
| AI Purple | `#8b5cf6` (violet-500) | All AI features — summary card, chat, NL search |
| Background | `#f8fafc` (slate-50) | Page background |
| Surface | `#ffffff` | Cards |
| Text Primary | `#0f172a` (slate-900) | Headings, body |
| Text Secondary | `#64748b` (slate-500) | Labels, captions |
| Border | `#e2e8f0` (slate-200) | Dividers |

### Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| Font family | Inter (Google Fonts) | — | — |
| Page title | Inter | 700 | 24px (`text-2xl`) |
| Section heading | Inter | 600 | 18px (`text-lg`) |
| Body | Inter | 400 | 16px (`text-base`) |
| Caption | Inter | 500 | 14px (`text-sm`) |
| Train numbers | JetBrains Mono | 500 | 16px (monospace) |

### Spacing & Radius

- Card padding: `p-4` (16px)
- Card radius: `rounded-xl` (12px)
- Card shadow: `shadow-sm`
- Section gap: `gap-4`
- Page padding: `px-4 py-6` (mobile), `px-8` (desktop)

---

## Pages & Layout

### Global Layout

```
┌─────────────────────────────────────┐
│  Top Bar (logo + nav)               │
│  ─────────────────────────────────  │
│                                     │
│         Page Content                │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  Bottom Nav (mobile)                │  ← Home, Search, AI, Alerts
└─────────────────────────────────────┘

  + Floating AI Chat Button (bottom-right, always visible)
```

- **Mobile-first**: Bottom nav with 4 tabs
- **Desktop**: Top navbar, sidebar for AI chat
- **Floating AI button**: Purple circle (bottom-right), opens AI assistant drawer on any page
- Breakpoint: `md:` (768px)

---

## Page 1: Home (`/`)

```
┌─────────────────────────────────────┐
│                                     │
│   🚂 GeoPulse                       │
│   Track any Indian train, live.     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🔍 Search by number or name  │  │  ← Tap → /search
│  └───────────────────────────────┘  │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  ✨ Ask AI                    ║  │  ← PROMINENT: violet bg
│  ║                               ║  │     gradient card
│  ║  "Trains from Delhi to        ║  │
│  ║   Mumbai tomorrow"            ║  │
│  ║                               ║  │
│  ║  [Type your question...]      ║  │  ← Input field
│  ║              [Ask]            ║  │  ← Purple button
│  ╚═══════════════════════════════╝  │
│                                     │
│  Recently Tracked                   │
│  ┌────────┐ ┌────────┐ ┌────────┐  │  ← Horizontal scroll
│  │ 12301  │ │ 12951  │ │ 22691  │  │     (localStorage)
│  │ Rajdh. │ │ Mumbai │ │ Bande  │  │
│  └────────┘ └────────┘ └────────┘  │
│                                     │
│  Powered by AI                      │
│  ┌──────────────────────────────┐   │
│  │ Ask questions naturally      │   │
│  │ Get AI-powered summaries     │   │
│  │ Real-time train tracking     │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

- Top section: gradient `bg-gradient-to-b from-blue-900 to-blue-800`, white text
- AI card: `bg-gradient-to-r from-violet-500 to-purple-600`, white text, prominent
- When user types in AI box and submits → `POST /api/ai/search` → show results inline or navigate to /search with results
- Recent trains: from localStorage, horizontal scroll cards

---

## Page 2: Search (`/search`)

```
┌─────────────────────────────────────┐
│  ← Back              Search         │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║ ✨ Ask AI: "trains to Mumbai" ║  │  ← AI search bar at TOP
│  ║                        [Ask]  ║  │     violet accent border
│  ╚═══════════════════════════════╝  │
│                                     │
│  ── or search manually ──           │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [By Number] [By Name] [From→To]││  ← Pill tabs
│  └─────────────────────────────────┘│
│                                     │
│  Tab: By Number                     │
│  ┌───────────────────────────────┐  │
│  │  Train Number: [12301    ]    │  │
│  │              [Search]         │  │
│  └───────────────────────────────┘  │
│                                     │
│  Tab: From → To                     │
│  ┌───────────────────────────────┐  │
│  │  From: [New Delhi  ▼]        │  │  ← Autocomplete
│  │  To:   [Mumbai CST ▼]        │  │
│  │              [Search]         │  │
│  └───────────────────────────────┘  │
│                                     │
│  AI Caption (when AI search used):  │
│  ┌───────────────────────────────┐  │
│  │ ✨ "Found 5 trains from       │  │  ← violet-50 bg card
│  │ New Delhi to Mumbai CST"      │  │
│  └───────────────────────────────┘  │
│                                     │
│  Results                            │
│  ┌───────────────────────────────┐  │
│  │ 12301 · Howrah Rajdhani  →    │  │
│  ├───────────────────────────────┤  │
│  │ 12951 · Mumbai Rajdhani  →    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

- AI search is **above** manual search — it's the primary way to search
- AI caption: shown when results come from `POST /api/ai/search`
- Tabs for manual search: Number, Name, From→To
- Station autocomplete: debounced `GET /api/stations?name=...`
- Results: cards with train number (mono), name, type badge → click → `/train/:id`

---

## Page 3: Train Track (`/train/:id`) — THE HERO PAGE

```
┌─────────────────────────────────────┐
│  ← Back    12301 Howrah Rajdhani    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │         MAP (Leaflet)         │  │  ← 45% viewport height
│  │    Route polyline (blue)      │  │
│  │    Train marker (🚂 pulse)    │  │
│  │    User marker (blue dot)     │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  ✨ AI Status                 ║  │  ← PROMINENT: violet gradient
│  ║                               ║  │     card, always visible
│  ║  "Your train is about 12 min  ║  │
│  ║   late. Next stop: Kanpur     ║  │
│  ║   Central in ~18 minutes."    ║  │
│  ║                               ║  │
│  ║  Updated 30s ago              ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ Delay    │  │ Next Stn │        │  ← Stat cards
│  │ 12 min   │  │ Kanpur   │        │
│  │ ⚠ amber  │  │ ETA 14:35│        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ [📍 I'm on this train]       │  │  ← Large toggle button
│  └───────────────────────────────┘  │
│  ┌──────────┐  ┌──────────┐        │
│  │ 🔔 Alert │  │ ✨ Ask AI│        │  ← Two action buttons
│  └──────────┘  └──────────┘        │
│                                     │
│  Schedule                           │
│  ┌───────────────────────────────┐  │
│  │ ● New Delhi    dep 16:55  ✓  │  │  ← Green dot = departed
│  │ │                             │  │
│  │ ◉ Kanpur Ctrl  arr 22:10     │  │  ← Blue pulse = current
│  │ │              delay +12 min  │  │
│  │ ○ Allahabad    arr 00:15     │  │  ← Gray = upcoming
│  │ │                             │  │
│  │ ○ Mughal Sarai arr 02:40     │  │
│  │ │                             │  │
│  │ ○ Howrah       arr 06:55     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  ✨ Ask about this train      ║  │  ← AI CHAT: visible section
│  ║                               ║  │     NOT collapsed by default
│  ║  ┌─────────────────────────┐  ║  │
│  ║  │ You: When will I reach  │  ║  │     User bubble (right, blue)
│  ║  │      Howrah?            │  ║  │
│  ║  └─────────────────────────┘  ║  │
│  ║  ┌─────────────────────────┐  ║  │
│  ║  │ AI: Based on current    │  ║  │     AI bubble (left, violet)
│  ║  │ status, you should      │  ║  │
│  ║  │ reach Howrah at ~07:07  │  ║  │
│  ║  │ AM (12 min late).       │  ║  │
│  ║  └─────────────────────────┘  ║  │
│  ║                               ║  │
│  ║  [Ask about this train...]    ║  │  ← Input + send button
│  ║                        [Send] ║  │
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘
```

### AI Features on this page (3 visible AI elements):

**1. AI Status Summary Card** (always visible, right below map)
- `bg-gradient-to-r from-violet-500 to-purple-600`, white text
- Sparkle icon (✨) to indicate AI-generated
- Auto-fetches `GET /api/trains/:id/live/summary` when page loads
- Refreshes with live data every 30s
- Fallback: "Live summary unavailable" if Groq fails

**2. "Ask AI" Action Button** (next to Alert button)
- Scrolls down to the AI Chat section
- Purple accent color to stand out

**3. AI Chat Section** (visible, NOT collapsed)
- Full chat UI at bottom of page, expanded by default
- Purple/violet border and header
- User messages: right-aligned, `bg-blue-500 text-white`
- AI messages: left-aligned, `bg-violet-100 text-violet-900`
- Calls `POST /api/ai/assistant` with `{ train_id, message }`
- Shows typing indicator while waiting
- Suggested quick questions: "When will I reach [destination]?", "Why is it delayed?", "What's the next stop?"

### Map section:
- Route: Blue polyline (`#3b82f6`, 3px)
- Train: Custom train icon, pulsing animation at current position
- User: Blue dot with accuracy circle (only when "I'm on this train" active)
- Station dots along route
- Auto-fit bounds to show full route

### Info panel:
- Delay badge colors: `bg-emerald-100` (on time), `bg-amber-100` (1-30 min), `bg-red-100` (>30 min)
- ETA: large, clear
- Source label: tiny "via WhereIsMyTrain" text

### Schedule timeline:
- Vertical stepper with colored dots + connecting line
- Green filled = departed, Blue pulsing = current, Gray empty = upcoming
- Current station row: `bg-blue-50` highlight
- Shows actual times and per-stop delay if available

### "I'm on this train":
- Large toggle: `bg-blue-600 text-white` active, `border-blue-600` inactive
- Requests browser Geolocation (watchPosition)
- Calls `GET /api/trains/:id/route/snap` to snap user to track
- Shows user marker on map

### Alert modal:
- Bottom sheet modal
- Station dropdown (from schedule), minutes input
- Calls `POST /api/alerts`

---

## Page 4: Alerts (`/alerts`)

```
┌─────────────────────────────────────┐
│  Alerts                             │
│                                     │
│  Active                             │
│  ┌───────────────────────────────┐  │
│  │ 🔔 12301 Howrah Rajdhani     │  │
│  │ 10 min before Kanpur Central │  │
│  │ Status: ⏳ Waiting            │  │
│  │                    [Delete]   │  │
│  ├───────────────────────────────┤  │
│  │ 🔔 12951 Mumbai Rajdhani     │  │
│  │ 5 min before Mumbai CST      │  │
│  │ Status: ✅ Triggered!         │  │
│  └───────────────────────────────┘  │
│                                     │
│  When an alert triggers, you'll     │
│  see a notification banner here.    │
└─────────────────────────────────────┘
```

- User ID: generated UUID, stored in localStorage
- Polls `GET /api/alerts?user_id=...` every 30s
- Triggered alert: in-app toast banner at top of screen

---

## Floating AI Chat Button (Global)

```
                                  ┌────┐
                                  │ ✨ │  ← Always visible
                                  │    │     bottom-right
                                  └────┘     every page
```

- Purple circle button, fixed `bottom-6 right-6`
- On click: opens a slide-up drawer/panel with the AI assistant
- If on a train page: pre-filled with that train's context
- If on home/search: acts as general AI search
- This ensures the AI is **always one tap away** from any page

---

## Component Tree

```
App
├── Layout
│   ├── TopBar
│   ├── <Outlet />
│   ├── BottomNav (mobile: Home, Search, AI, Alerts)
│   └── FloatingAIButton → AIDrawer
│
├── Pages
│   ├── HomePage
│   │   ├── HeroSection (title, gradient bg)
│   │   ├── SearchBar (→ /search)
│   │   ├── AISearchCard (prominent, violet)
│   │   └── RecentTrains
│   │
│   ├── SearchPage
│   │   ├── AISearchBar (top, primary)
│   │   ├── SearchTabs (Number | Name | From→To)
│   │   ├── StationAutocomplete
│   │   ├── AICaption
│   │   └── TrainResultsList → TrainCard
│   │
│   ├── TrainTrackPage
│   │   ├── TrainMap (Leaflet)
│   │   │   ├── RoutePolyline
│   │   │   ├── TrainMarker (pulsing)
│   │   │   ├── UserMarker (conditional)
│   │   │   └── StationDots
│   │   ├── AISummaryCard (violet gradient, always visible)
│   │   ├── StatusCards (delay + next station + ETA)
│   │   ├── ActionButtons
│   │   │   ├── ImOnTrainToggle
│   │   │   ├── SetAlertButton → AlertModal
│   │   │   └── AskAIButton (scrolls to chat)
│   │   ├── ScheduleTimeline → ScheduleStop
│   │   └── AIChatSection (expanded by default)
│   │       ├── QuickQuestions (suggested prompts)
│   │       ├── ChatMessages (user + AI bubbles)
│   │       └── ChatInput
│   │
│   └── AlertsPage → AlertCard
│
├── Global
│   ├── FloatingAIButton
│   ├── AIDrawer (slide-up panel)
│   ├── ToastNotification
│   ├── OfflineBanner
│   ├── LoadingSpinner
│   └── ErrorBanner
│
└── Services
    ├── api/client.ts (axios, base URL)
    ├── api/trains.ts
    ├── api/stations.ts
    ├── api/ai.ts (search + assistant)
    ├── api/alerts.ts
    └── api/offline.ts
```

---

## Folder Structure

```
frontend/src/
├── main.tsx
├── App.tsx
├── index.css
├── api/
│   ├── client.ts
│   ├── trains.ts
│   ├── stations.ts
│   ├── ai.ts
│   ├── alerts.ts
│   └── offline.ts
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx
│   │   ├── BottomNav.tsx
│   │   └── Layout.tsx
│   ├── search/
│   │   ├── SearchTabs.tsx
│   │   ├── StationAutocomplete.tsx
│   │   ├── TrainCard.tsx
│   │   └── AISearchInput.tsx
│   ├── train/
│   │   ├── TrainMap.tsx
│   │   ├── AISummaryCard.tsx
│   │   ├── StatusCards.tsx
│   │   ├── ScheduleTimeline.tsx
│   │   ├── AlertModal.tsx
│   │   └── AIChatSection.tsx
│   ├── ai/
│   │   ├── FloatingAIButton.tsx
│   │   ├── AIDrawer.tsx
│   │   ├── ChatBubble.tsx
│   │   └── QuickQuestions.tsx
│   ├── alerts/
│   │   └── AlertCard.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBanner.tsx
│       ├── OfflineBanner.tsx
│       ├── Toast.tsx
│       ├── Badge.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useGeolocation.ts
│   ├── useOnlineStatus.ts
│   └── useDeviceId.ts
├── store/
│   └── useAppStore.ts
├── pages/
│   ├── HomePage.tsx
│   ├── SearchPage.tsx
│   ├── TrainTrackPage.tsx
│   └── AlertsPage.tsx
└── types/
    └── index.ts
```

---

## Routes

| Path | Page |
|---|---|
| `/` | HomePage |
| `/search` | SearchPage |
| `/train/:id` | TrainTrackPage |
| `/alerts` | AlertsPage |

---

## AI Features — Visibility Summary

The AI is surfaced in **5 places** across the app:

| Location | Feature | API | Visual Treatment |
|---|---|---|---|
| **Home page** | AI Search card | `POST /api/ai/search` | Large violet gradient card, prominent |
| **Search page** | AI search bar (top) | `POST /api/ai/search` | Violet-bordered input at top of page |
| **Train page** | AI Status Summary | `GET /api/trains/:id/live/summary` | Violet gradient card below map |
| **Train page** | AI Chat section | `POST /api/ai/assistant` | Expanded chat UI with bubbles |
| **Every page** | Floating AI button | Opens AI drawer | Purple circle, bottom-right corner |

All AI elements use **violet/purple** accent (`#8b5cf6`) with a sparkle (✨) icon to make them instantly recognizable as AI-powered features.

---

## Data Flow

```
User opens app → HomePage
  ├─ Types in AI box: "trains from Delhi to Mumbai"
  │   → POST /api/ai/search → results + AI caption
  │   → Navigate to /search with results
  │
  └─ Taps search bar → /search
      → Tabs: By Number / By Name / From→To
      → GET /api/trains?number=12301
      → Click result → /train/12301

TrainTrackPage loads:
  1. GET /api/trains/12301              (info + schedule)
  2. GET /api/trains/12301/route        (polyline → map)
  3. GET /api/trains/12301/live         (position, delay) ← refetch 30s
  4. GET /api/trains/12301/live/summary (AI text) ← refetch 30s

User clicks "I'm on this train":
  → navigator.geolocation.watchPosition()
  → GET /api/trains/12301/route/snap?lat=...&lng=...
  → User marker on map (snapped to track)

User clicks "Set Alert":
  → Modal: pick station + minutes
  → POST /api/alerts

User types in AI Chat: "When will I reach Howrah?"
  → POST /api/ai/assistant { train_id: "12301", message: "..." }
  → AI reply in chat bubble

Floating AI button (any page):
  → Opens drawer
  → If on train page: context = that train
  → If elsewhere: general AI search
```

---

## Responsive Layout

| Breakpoint | Layout |
|---|---|
| **Mobile** (<768px) | Bottom nav, map 45vh, single column, floating AI button |
| **Tablet** (768–1024px) | Top nav, map 50vh, 2-col stat cards |
| **Desktop** (>1024px) | Top nav, map left 60% + panel right 40%, AI chat in sidebar |

---

## PWA

- `manifest.json`: name "GeoPulse", theme `#1e3a8a`, display "standalone"
- **Service Worker** (Workbox via `vite-plugin-pwa`):
  - Cache-first: JS, CSS, fonts, icons
  - Network-first: `/api/stations`, `/api/trains`, `/api/trains/:id`, `/api/trains/:id/route`
  - Network-only: `/api/trains/:id/live` (never serve stale live data)
- **Offline banner**: "You're offline" bar when `navigator.onLine === false`
- **IndexedDB**: Store data from `GET /api/offline/bundle` for offline search

---

## Implementation Order

| Step | What | Files |
|---|---|---|
| 1 | Install deps, setup Tailwind, Inter font | `package.json`, `index.css`, `tailwind.config` |
| 2 | Layout + TopBar + BottomNav + routes | `Layout.tsx`, `TopBar.tsx`, `BottomNav.tsx`, `App.tsx` |
| 3 | API client + TypeScript types | `api/client.ts`, `types/index.ts` |
| 4 | HomePage (hero, search bar, AI card, recent trains) | `HomePage.tsx`, `AISearchInput.tsx` |
| 5 | SearchPage (AI bar, tabs, autocomplete, results) | `SearchPage.tsx`, `SearchTabs.tsx`, `StationAutocomplete.tsx`, `TrainCard.tsx` |
| 6 | TrainTrackPage — schedule timeline | `TrainTrackPage.tsx`, `ScheduleTimeline.tsx` |
| 7 | TrainTrackPage — map (Leaflet, route, markers) | `TrainMap.tsx` |
| 8 | TrainTrackPage — live status (auto-refresh, stat cards) | `StatusCards.tsx` |
| 9 | TrainTrackPage — AI Summary Card | `AISummaryCard.tsx` |
| 10 | TrainTrackPage — AI Chat Section | `AIChatSection.tsx`, `ChatBubble.tsx`, `QuickQuestions.tsx` |
| 11 | Floating AI Button + AI Drawer (global) | `FloatingAIButton.tsx`, `AIDrawer.tsx` |
| 12 | "I'm on this train" (geolocation, snap, user marker) | `useGeolocation.ts`, map updates |
| 13 | Alerts page + Alert modal | `AlertsPage.tsx`, `AlertModal.tsx`, `AlertCard.tsx` |
| 14 | PWA (manifest, service worker, offline banner) | `vite.config.ts`, `OfflineBanner.tsx` |
| 15 | Polish (loading, error, empty states, toasts) | shared components |
