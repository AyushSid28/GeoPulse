import api from './client'
import type { Alert } from '../types'

export async function createAlert(payload: {
  train_id: string
  user_id: string
  station_id: string
  minutes_before?: number
}): Promise<Alert> {
  const { data } = await api.post('/api/alerts', payload)
  return data
}

export async function listAlerts(userId: string, trainId?: string): Promise<Alert[]> {
  const { data } = await api.get('/api/alerts', { params: { user_id: userId, train_id: trainId } })
  return data
}
