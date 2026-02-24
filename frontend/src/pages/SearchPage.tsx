import { useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { listTrains } from '../api/trains'
import { aiSearch } from '../api/ai'
import AISearchInput from '../components/search/AISearchInput'
import StationAutocomplete from '../components/search/StationAutocomplete'
import TrainCard from '../components/search/TrainCard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import EmptyState from '../components/shared/EmptyState'
import type { Train, Station } from '../types'

type Tab = 'number' | 'name' | 'fromto'

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>('number')
  const [numberInput, setNumberInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [fromStation, setFromStation] = useState<Station | null>(null)
  const [toStation, setToStation] = useState<Station | null>(null)

  const [results, setResults] = useState<Train[]>([])
  const [aiCaption, setAiCaption] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const reset = () => {
    setResults([])
    setAiCaption(null)
    setError(null)
  }

  const handleAISearch = async (query: string) => {
    reset()
    setAiLoading(true)
    setSearched(true)
    try {
      const data = await aiSearch(query)
      setResults(data.results)
      setAiCaption(data.caption)
    } catch {
      setError('AI search failed. Try manual search below.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleManualSearch = async () => {
    reset()
    setLoading(true)
    setSearched(true)
    try {
      let data: Train[] = []
      if (tab === 'number' && numberInput.trim()) {
        data = await listTrains({ number: numberInput.trim() })
      } else if (tab === 'name' && nameInput.trim()) {
        data = await listTrains({ name: nameInput.trim() })
      } else if (tab === 'fromto' && fromStation && toStation) {
        data = await listTrains({
          from_station_id: fromStation.code,
          to_station_id: toStation.code,
        })
      } else {
        setError('Please fill in the search fields.')
        setLoading(false)
        return
      }
      setResults(data)
    } catch {
      setError('Search failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleManualSearch()
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'number', label: 'By Number' },
    { key: 'name', label: 'By Name' },
    { key: 'fromto', label: 'From → To' },
  ]

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Search Trains</h1>

      {/* AI search — primary */}
      <AISearchInput onSearch={handleAISearch} loading={aiLoading} compact />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-secondary">or search manually</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Tab pills */}
      <div className="flex gap-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); reset(); setSearched(false) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              tab === key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-3">
        {tab === 'number' && (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-light">
              <Search className="w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={numberInput}
                onChange={(e) => setNumberInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter train number, e.g. 12301"
                className="flex-1 bg-transparent text-sm focus:outline-none font-mono"
              />
            </div>
            <button onClick={handleManualSearch} disabled={loading} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
              Search
            </button>
          </div>
        )}

        {tab === 'name' && (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-light">
              <Search className="w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter train name, e.g. Rajdhani"
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <button onClick={handleManualSearch} disabled={loading} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
              Search
            </button>
          </div>
        )}

        {tab === 'fromto' && (
          <div className="space-y-3">
            <StationAutocomplete label="From" placeholder="Origin station..." value={fromStation} onChange={setFromStation} />
            <StationAutocomplete label="To" placeholder="Destination station..." value={toStation} onChange={setToStation} />
            <button
              onClick={handleManualSearch}
              disabled={loading || !fromStation || !toStation}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50"
            >
              Search Trains
            </button>
          </div>
        )}
      </div>

      {/* AI caption */}
      {aiCaption && (
        <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
          <Sparkles className="w-4 h-4 text-ai mt-0.5 shrink-0" />
          <p className="text-sm text-violet-800">{aiCaption}</p>
        </div>
      )}

      {/* Loading */}
      {(loading || aiLoading) && <LoadingSpinner label="Searching trains..." />}

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

      {/* Results */}
      {!loading && !aiLoading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary font-medium">
            {results.length} train{results.length !== 1 ? 's' : ''} found
          </p>
          {results.map((train) => (
            <TrainCard key={train.id} train={train} />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && !aiLoading && searched && results.length === 0 && !error && (
        <EmptyState icon={Search} title="No trains found" subtitle="Try a different search query." />
      )}
    </div>
  )
}
