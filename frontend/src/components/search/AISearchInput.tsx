import { useState } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'

interface Props {
  onSearch: (query: string) => void
  loading?: boolean
  compact?: boolean
}

export default function AISearchInput({ onSearch, loading, compact }: Props) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    onSearch(trimmed)
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-2 border-ai rounded-xl px-3 py-2 bg-violet-50">
        <Sparkles className="w-4 h-4 text-ai shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI: &quot;trains to Mumbai&quot;"
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder-violet-400"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-ai text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-600 transition disabled:opacity-50"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>
    )
  }

  return (
    <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6 text-white shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5" />
        <h2 className="font-semibold text-lg">Ask AI</h2>
      </div>
      <p className="text-violet-100 text-sm mb-4">"Trains from Delhi to Mumbai tomorrow"</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/20 placeholder-violet-200 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 text-white"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-white text-violet-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-violet-50 transition disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? '...' : (
            <>Ask <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  )
}
