import { Bell, CheckCircle, Clock } from 'lucide-react'
import type { Alert } from '../../types'

interface Props {
  alert: Alert
}

export default function AlertCard({ alert }: Props) {
  return (
    <div className={`bg-surface border rounded-xl px-4 py-3 shadow-sm ${
      alert.triggered ? 'border-emerald-300 bg-emerald-50' : 'border-border'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          alert.triggered ? 'bg-emerald-100' : 'bg-blue-100'
        }`}>
          {alert.triggered
            ? <CheckCircle className="w-4 h-4 text-emerald-600" />
            : <Bell className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-sm font-medium text-primary">{alert.train_number}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              alert.triggered
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {alert.triggered ? 'Triggered' : 'Waiting'}
            </span>
          </div>
          <p className="text-sm text-text-primary">
            {alert.minutes_before} min before <span className="font-medium">{alert.station_name}</span>
          </p>
          <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(alert.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
