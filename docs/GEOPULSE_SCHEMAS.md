# GeoPulse — Schemas Reference

**Purpose:** Canonical definitions for internal DB/API entities and for external API responses we consume. Use this when implementing models (SQLAlchemy, Pydantic, MongoDB), ingest, and API contracts.

**Scope:** India only. Data sources: RailRadar API (primary for static lists initially), Indian Rail API (live status, schedule, stations when key available).

---

## 1. Internal entities (our DB / API)

These are the shapes we store and expose from our backend. Field types are described; exact types (e.g. `UUID`, `datetime`) depend on DB/ORM choice.

---

### 1.1 Station

| Field     | Type        | Required | Notes |
|----------|-------------|----------|--------|
| `id`     | string/UUID | yes      | Primary key (we generate). |
| `code`   | string      | yes      | 2–5 char station code (e.g. NDLS, HWH). Unique. |
| `name`   | string      | yes      | Display name (e.g. "New Delhi"). |
| `lat`    | float       | no       | Latitude (from Indian Rail API / data.gov.in). |
| `lng`    | float       | no       | Longitude. |
| `zone`   | string      | no       | Railway zone code if available. |

**Indexes:** `code` (unique), `name` (search).

---

### 1.2 Train

| Field   | Type   | Required | Notes |
|---------|--------|----------|--------|
| `id`    | string/UUID | yes | Primary key (we generate). |
| `number`| string | yes | Train number (e.g. "12565"). Unique. |
| `name`  | string | yes | Train name (e.g. "Rajdhani Express"). |
| `type`  | string | no  | EXP, SF, passenger, etc. (from APIs or derived). |

**Indexes:** `number` (unique), `name` (search).

---

### 1.3 StopTime (schedule row: one train at one station)

| Field           | Type        | Required | Notes |
|-----------------|-------------|----------|--------|
| `id`            | string/UUID | yes      | Primary key. |
| `train_id`      | FK → Train  | yes      | |
| `station_id`    | FK → Station| yes      | |
| `sequence`     | int         | yes      | Order on route (0 = origin). |
| `arrival_time`  | time/string | no       | Scheduled arrival (e.g. "08:25" or "Source"). |
| `departure_time`| time/string | no       | Scheduled departure (e.g. "08:25" or "Destination"). |
| `distance`      | float       | no       | Distance from origin (km) if available. |
| `platform`      | string      | no       | Platform number when known. |

**Unique:** `(train_id, station_id)` or `(train_id, sequence)`.

---

### 1.4 RouteGeometry

Stored route for drawing the line on the map. One record per train (or per route variant if you support that).

| Field      | Type        | Required | Notes |
|------------|-------------|----------|--------|
| `id`       | string/UUID | yes      | Primary key. |
| `train_id` | FK → Train  | yes      | |
| `geometry` | linestring / GeoJSON | yes | List of [lng, lat] or PostGIS LINESTRING. |
| `updated_at` | datetime  | no       | When derived/fetched. |

**Note:** Can be derived from station coordinates (order by StopTime.sequence) if no API gives polyline.

---

### 1.5 LiveTrainStatus (cached / response shape for “live” endpoint)

What we return from `GET /api/trains/:id/live` (and optionally cache in Redis). Not necessarily a single DB table; can be built from external API + route.

| Field               | Type   | Required | Notes |
|---------------------|--------|----------|--------|
| `train_id`         | string | yes      | Our train id or number. |
| `journey_date`     | date   | yes      | YYYY-MM-DD. |
| `current_station`  | object | no       | See LiveStationStop below. |
| `next_station`     | object | no       | Same shape. |
| `position`          | object | no       | `{ "lat", "lng" }` if derivable; else null. |
| `delay_minutes`    | int    | no       | Current delay (minutes). |
| `route`            | array  | no       | List of LiveStationStop for full route with actual times. |
| `last_updated`      | datetime | no     | When we last fetched from external API. |
| `source`           | string | no       | e.g. "indian_rail_api", "railradar". |

**LiveStationStop (nested):**

| Field                | Type   | Notes |
|----------------------|--------|--------|
| `station_code`      | string | e.g. JTB. |
| `station_name`       | string | |
| `sequence`           | int    | |
| `scheduled_arrival` | string | e.g. "04:27PM". |
| `actual_arrival`     | string | |
| `delay_arrival`      | string | e.g. "14 M" or "00 M". |
| `scheduled_departure` | string | |
| `actual_departure`   | string | |
| `delay_departure`    | string | |
| `is_departed`        | bool/string | Whether train has left this station. |

---

### 1.6 LiveStationBoard (optional – for “trains at a station”)

Used when we implement “station board” (Indian Rail API Live Station).

| Field       | Type   | Notes |
|-------------|--------|--------|
| `station_code` | string | |
| `station_name`  | string | optional |
| `hours`         | int    | 2 or 4. |
| `trains`        | array  | List of LiveStationTrain. |
| `fetched_at`    | datetime | |

**LiveStationTrain (each item):**

| Field              | Type   | Notes |
|--------------------|--------|--------|
| `number`           | string | Train number. |
| `name`             | string | |
| `source`           | string | Station code. |
| `destination`      | string | Station code. |
| `schedule_arrival` | string | |
| `schedule_departure` | string | |
| `expected_arrival` | string | e.g. "17:10, 15 Sep". |
| `expected_departure` | string | |
| `delay_arrival`    | string | e.g. "06:05" or "RT". |
| `delay_departure`   | string | |
| `halt`             | string | e.g. "00:05". |

---

### 1.7 UserTrip (optional – Phase 3+)

For “I’m on this train” and alerts.

| Field       | Type     | Required | Notes |
|-------------|----------|----------|--------|
| `id`        | string/UUID | yes  | |
| `user_id`   | string   | no       | If we add auth. |
| `train_id`  | FK → Train | yes  | |
| `started_at`| datetime | yes      | When user marked “on train”. |
| `ended_at`  | datetime | no       | When user turned off. |

---

### 1.8 Alert (optional – Phase 6)

| Field           | Type     | Required | Notes |
|-----------------|----------|----------|--------|
| `id`            | string/UUID | yes  | |
| `user_id`      | string   | no       | |
| `train_id`      | FK → Train | yes  | |
| `station_id`    | FK → Station | yes | |
| `minutes_before`| int      | yes      | Notify X min before station. |
| `triggered_at`  | datetime | no       | When we fired the alert. |

---

## 2. External API response schemas (what we consume)

Exact field names and types from providers so we can parse and map into internal entities.

---

### 2.1 Indian Rail API — Live Train Status

**Endpoint:** `GET .../livetrainstatus/apikey/<key>/trainnumber/<no>/date/<yyyymmdd>/`

**Response (root):**

| Field            | Type   | Notes |
|------------------|--------|--------|
| `ResponseCode`   | string | e.g. "200". |
| `StartDate`      | string | dd-mm-yyyy. |
| `TrainNumber`    | string | |
| `CurrentPosition`| string/null | Often null. |
| `CurrentStation` | object | See below. |
| `TrainRoute`     | array  | Array of route stop objects. |
| `Message`        | string | e.g. "SUCCESS". |

**CurrentStation / TrainRoute[] item:**

| Field              | Type   | Notes |
|--------------------|--------|--------|
| `SerialNo`         | string | Sequence. |
| `StationName`       | string | |
| `StationCode`       | string | |
| `Distance`          | string | "-" or km. |
| `IsDeparted`        | string | |
| `Day`               | string | |
| `ScheduleArrival`   | string | e.g. "04:27PM", "Source". |
| `ActualArrival`     | string | |
| `DelayInArrival`    | string | e.g. "14 M", "00 M". |
| `ScheduleDeparture` | string | e.g. "Destination". |
| `ActualDeparture`   | string | |
| `DelayInDeparture`   | string | |

---

### 2.2 Indian Rail API — Live Station

**Endpoint:** `GET .../LiveStation/apikey/<key>/StationCode/<code>/hours/<2|4>/`

**Response (root):**

| Field          | Type   | Notes |
|----------------|--------|--------|
| `ResponseCode` | string | |
| `Status`       | string | e.g. "SUCCESS". |
| `Trains`       | array  | See below. |
| `Message`      | string | |

**Trains[] item:**

| Field             | Type   | Notes |
|-------------------|--------|--------|
| `Name`            | string | Train name. |
| `Number`          | string | Train number. |
| `Source`          | string | Station code. |
| `Destination`     | string | Station code. |
| `ScheduleArrival` | string | e.g. "11:05". |
| `ScheduleDeparture` | string | |
| `Halt`            | string | e.g. "00:05". |
| `ExpectedArrival` | string | e.g. "17:10, 15 Sep". |
| `DelayInArrival`  | string | e.g. "06:05" or "RT". |
| `ExpectedDeparture` | string | |
| `DelayInDeparture` | string | |

---

### 2.3 Indian Rail API — Train Schedule (route + times)

**Endpoint:** `GET .../TrainSchedule/apikey/<key>/TrainNumber/<no>/`

**Response (root):**

| Field          | Type   | Notes |
|----------------|--------|--------|
| `ResponseCode` | string | |
| `Status`       | string | |
| `Route`        | array  | See below. |
| `Message`      | string | |

**Route[] item:**

| Field           | Type   | Notes |
|-----------------|--------|--------|
| `SerialNo`      | string | |
| `StationCode`   | string | |
| `StationName`   | string | |
| `ArrivalTime`   | string | e.g. "08:35:00". |
| `DepartureTime` | string | |
| `Distance`      | string | e.g. "0". |

---

### 2.4 Indian Rail API — Train Between Stations

**Endpoint:** `GET .../TrainBetweenStation/apikey/<key>/From/<code>/To/<code>/`

**Response (root):**

| Field          | Type   | Notes |
|----------------|--------|--------|
| `ResponseCode` | string | |
| `Status`       | string | |
| `TotalTrains`  | string | e.g. "34". |
| `Trains`       | array  | See below. |
| `Message`      | string | |

**Trains[] item:**

| Field         | Type   | Notes |
|---------------|--------|--------|
| `TrainNo`     | string | |
| `TrainName`   | string | |
| `Source`      | string | Station code. |
| `Destination` | string | Station code. |
| `ArrivalTime` | string | e.g. "02:55". |
| `DepartureTime` | string | |
| `TravelTime`  | string | e.g. "02:30H". |
| `TrainType`   | string | e.g. "EXP", "SF". |

---

### 2.5 Indian Rail API — Station (code/name search)

**StationCodeToName / StationNameToCode / StationCodeOrName** return (or include) station details with:

- `StationCode`, `StationName` (and possibly Hindi name)
- `Latitude`, `Longitude` (when available)

Use these to populate **Station** `code`, `name`, `lat`, `lng`.

---

### 2.6 RailRadar API

**Trains list:** `GET /api/v1/trains/all-kvs`  
**Header:** `X-API-Key: <key>`

**Response:** Array of 2-element arrays: `[train_number, train_name]`.  
Example: `[["12951", "Rajdhani Express"], ...]`

**Stations list:** `GET /api/v1/stations/all-kvs`  
**Header:** `X-API-Key: <key>`

**Response:** Array of 2-element arrays: `[station_code, station_name]`.  
Example: `[["NDLS", "New Delhi"], ...]`

**Note:** RailRadar does not expose lat/lng in these endpoints. Use Indian Rail API station APIs or data.gov.in for coordinates when you have the key; until then, stations can have null lat/lng.

---

## 3. Mapping summary

| Internal entity   | Populated from (external) |
|-------------------|---------------------------|
| Station           | RailRadar stations/all-kvs (code, name); Indian Rail API station APIs or data.gov.in (lat, lng). |
| Train             | RailRadar trains/all-kvs (number, name); Indian Rail Train Between Stations / Schedule (type). |
| StopTime          | Indian Rail Train Schedule (Route[]) or Live Train Status (TrainRoute[]). |
| RouteGeometry     | Derived from Station lat/lng by StopTime.sequence, or future API if available. |
| LiveTrainStatus   | Indian Rail Live Train Status (current + route with actual times). |
| LiveStationBoard  | Indian Rail Live Station (Trains[]). |

---

*Use this document when creating Pydantic models, SQLAlchemy/MongoDB models, and ingest scripts. Keep it in sync as you add fields or new sources.*
