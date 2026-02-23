import api from './client'
import type { AISearchResult, AIAssistantResponse } from '../types'

export async function aiSearch(query: string): Promise<AISearchResult> {
  const { data } = await api.post('/api/ai/search', { query })
  return data
}

export async function aiAssistant(trainId: string, message: string, date?: string): Promise<AIAssistantResponse> {
  const { data } = await api.post('/api/ai/assistant', { train_id: trainId, message, date })
  return data
}
