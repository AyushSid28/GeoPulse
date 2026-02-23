export interface Station {
  id: string
  code: string
  name: string
  lat: number | null
  lng: number | null
  zone?: string
}

export interface Train {
  id: string
  number: string
  name: string
  type: string
}

export interface StopTime {
  sequence: number
  station_code: string
  station_name: string
  arrival_time: string | null
  departure_time: string | null
  platform?: string | null
}

export interface LiveStationStop {
  station_code: string
  station_name: string
  sequence: number
  scheduled_arrival?: string | null
  actual_arrival?: string | null
  delay_arrival?: number | null
  scheduled_departure?: string | null
  actual_departure?: string | null
  delay_departure?: number | null
}

export interface LiveTrainStatus {
  train_id: string
  journey_date: string
  current_station: LiveStationStop | null
  next_station: LiveStationStop | null
  position: { lat: number; lng: number } | null
  delay_minutes: number | null
  eta_next_station: string | null
  route: LiveStationStop[] | null
  last_updated: string | null
  source: string | null
}

export interface TrainDetail extends Train {
  schedule: StopTime[]
}

export interface Alert {
  id: string
  train_id: string
  train_number: string
  user_id: string
  type: string
  station_id: string
  station_code: string
  station_name: string
  minutes_before: number
  triggered: boolean
  created_at: string
}

export interface AISearchResult {
  extracted: {
    from_station: string | null
    to_station: string | null
    date: string | null
  }
  results: Train[]
  caption: string
}

export interface AIAssistantResponse {
  reply: string
}

export interface AISummaryResponse {
  summary: string
}

export interface SnapResult {
  snapped_lat: number
  snapped_lng: number
  distance_m: number
  nearest_segment_index: number
}
