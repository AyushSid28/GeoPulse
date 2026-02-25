import { Clock, MapPin, AlertTriangle, Timer } from 'lucide-react'
import type { LiveTrainStatus } from '../../types'

interface Props {
  live: LiveTrainStatus
}

function getDelayVariant(delay: number | null) {
  if (delay === null || delay === 0) return { label: 'On Time', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' }
  if (delay > 0 && delay <= 30) return { label: `${delay} min late`, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' }
  return { label: `${delay} min late`, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' }
}

export default function StatusCards({ live }: Props) {
  const delay = getDelayVariant(live.delay_minutes)

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Delay */}
      <div className={`${delay.bg} border ${delay.border} rounded-xl p-3`}>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className={`w-4 h-4 ${delay.icon}`} />
          <span className={`text-xs font-medium ${delay.text}`}>Delay</span>
        </div>
        <p className={`text-lg font-bold ${delay.text}`}>{delay.label}</p>
      </div>

      {/* Next station */}
      <div className="bg-surface border border-border rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1 text-text-secondary">
          <MapPin className="w-4 h-4" />
          <span className="text-xs font-medium">Next Station</span>
        </div>
        <p className="text-sm font-bold text-text-primary truncate">
          {live.next_station?.station_name || '—'}
        </p>
        {live.next_station?.station_code && (
          <span className="font-mono text-xs text-text-secondary">{live.next_station.station_code}</span>
        )}
      </div>

      {/* Current station */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1 text-blue-600">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-medium">Current Station</span>
        </div>
        <p className="text-sm font-bold text-blue-800 truncate">
          {live.current_station?.station_name || '—'}
        </p>
      </div>

      {/* ETA */}
      <div className="bg-surface border border-border rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1 text-text-secondary">
          <Timer className="w-4 h-4" />
          <span className="text-xs font-medium">ETA Next</span>
        </div>
        <p className="text-lg font-bold font-mono text-text-primary">
          {live.eta_next_station || '—'}
        </p>
      </div>
    </div>
  )
}
