import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles, ArrowRight, Clock, ChevronRight } from 'lucide-react'
import { aiSearch } from '../api/ai'
import TrainCard from '../components/search/TrainCard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import type { Train } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState<Train[] | null>(null)
  const [aiCaption, setAiCaption] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [recentTrains, setRecentTrains] = useState<Train[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('geopulse_recent')
    if (stored) {
      try { setRecentTrains(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = aiQuery.trim()
    if (!trimmed) return

    setAiLoading(true)
    setAiResults(null)
    setAiCaption(null)
    setAiError(null)

    try {
      const data = await aiSearch(trimmed)
      setAiResults(data.results)
      setAiCaption(data.caption)
    } catch {
      setAiError('AI search failed. Try the manual search.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary to-blue-800 text-white px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-2">GeoPulse</h1>
        <p className="text-blue-200 mb-6">Track any Indian train, live.</p>
        <button
          onClick={() => navigate('/search')}
          className="w-full max-w-md mx-auto flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-left text-blue-100 hover:bg-white/20 transition"
        >
          <Search className="w-5 h-5" />
          <span className="flex-1">Search by number or name</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* AI Search Card */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6 text-white shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Ask AI</h2>
          </div>
          <p className="text-violet-100 text-sm mb-4">"Trains from Delhi to Mumbai tomorrow"</p>
          <form onSubmit={handleAISearch} className="flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/20 placeholder-violet-200 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 text-white"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="bg-white text-violet-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-violet-50 transition disabled:opacity-50 flex items-center gap-1"
            >
              {aiLoading ? '...' : <>Ask <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        {/* AI Results (inline) */}
        {aiLoading && <LoadingSpinner label="Asking AI..." />}

        {aiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {aiError}
          </div>
        )}

        {aiCaption && (
          <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
            <Sparkles className="w-4 h-4 text-ai mt-0.5 shrink-0" />
            <p className="text-sm text-violet-800">{aiCaption}</p>
          </div>
        )}

        {aiResults && aiResults.length > 0 && (
          <div className="space-y-2">
            {aiResults.map((train) => (
              <TrainCard key={train.id} train={train} />
            ))}
          </div>
        )}

        {/* Recently Tracked */}
        {recentTrains.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-text-secondary" />
              <h2 className="font-semibold text-text-primary">Recently Tracked</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {recentTrains.map((train) => (
                <button
                  key={train.id}
                  onClick={() => navigate(`/train/${train.number}`)}
                  className="shrink-0 bg-surface border border-border rounded-xl px-4 py-3 shadow-sm hover:border-primary-light hover:shadow-md transition text-left min-w-[140px]"
                >
                  <p className="font-mono font-medium text-primary text-sm">{train.number}</p>
                  <p className="text-xs text-text-secondary truncate mt-0.5">{train.name}</p>
                  <ChevronRight className="w-3 h-3 text-text-secondary mt-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3 text-text-primary">Powered by AI</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ai" />
              Ask questions in natural language
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ai" />
              Get AI-powered status summaries
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ai" />
              Real-time train tracking on map
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
