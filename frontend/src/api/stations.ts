import api from './client'
import type { Station } from '../types'

export async function listStations(query?: string): Promise<Station[]> {
  const { data } = await api.get('/api/stations', { params: query ? { q: query } : undefined })
  return data
}

export async function getStation(stationId: string): Promise<Station> {
  const { data } = await api.get(`/api/stations/${stationId}`)
  return data
}
