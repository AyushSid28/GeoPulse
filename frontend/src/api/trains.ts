import api from './client'
import type { Train, TrainDetail, LiveTrainStatus, AISummaryResponse, SnapResult } from '../types'

export async function listTrains(params?: {
  number?: string
  name?: string
  from_station_id?: string
  to_station_id?: string
}): Promise<Train[]> {
  const { data } = await api.get('/api/trains', { params })
  return data
}

export async function getTrainDetail(trainId: string): Promise<TrainDetail> {
  const { data } = await api.get(`/api/trains/${trainId}`)
  return data
}

export async function getLiveStatus(trainId: string, date?: string): Promise<LiveTrainStatus> {
  const { data } = await api.get(`/api/trains/${trainId}/live`, { params: { date } })
  return data
}

export async function getLiveSummary(trainId: string, date?: string): Promise<AISummaryResponse> {
  const { data } = await api.get(`/api/trains/${trainId}/live/summary`, { params: { date } })
  return data
}

export async function getTrainRoute(trainId: string): Promise<{ train_id: string; geometry: [number, number][] }> {
  const { data } = await api.get(`/api/trains/${trainId}/route`)
  return data
}

export async function snapToRoute(trainId: string, lat: number, lng: number): Promise<SnapResult> {
  const { data } = await api.get(`/api/trains/${trainId}/route/snap`, { params: { lat, lng } })
  return data
}
