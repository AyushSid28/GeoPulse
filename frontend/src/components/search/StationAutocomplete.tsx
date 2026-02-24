import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { listStations } from '../../api/stations'
import type { Station } from '../../types'

interface Props {
  label: string
  placeholder?: string
  value: Station | null
  onChange: (station: Station | null) => void
}

export default function StationAutocomplete({ label, placeholder, value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Station[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const data = await listStations(q)
      setResults(data.slice(0, 15))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (val: string) => {
    setQuery(val)
    onChange(null)
    setIsOpen(true)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 300)
  }

  const handleSelect = (station: Station) => {
    onChange(station)
    setQuery(`${station.name} (${station.code})`)
    setIsOpen(false)
    setResults([])
  }

  useEffect(() => {
    if (value) {
      setQuery(`${value.name} (${value.code})`)
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-light focus-within:border-primary-light">
        <MapPin className="w-4 h-4 text-text-secondary shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder || 'Type station name or code...'}
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute z-30 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-text-secondary">Searching...</div>
          )}
          {results.map((station) => (
            <button
              key={station.id}
              onClick={() => handleSelect(station)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm transition flex items-center gap-2"
            >
              <span className="font-mono text-xs text-primary-light">{station.code}</span>
              <span className="truncate">{station.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
