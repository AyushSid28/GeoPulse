import { useState } from 'react'
import { X, Bell, Check } from 'lucide-react'
import { createAlert } from '../../api/alerts'
import useDeviceId from '../../hooks/useDeviceId'
import type { StopTime } from '../../types'

interface Props {
  trainId: string
  stops: StopTime[]
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function AlertModal({ trainId, stops, open, onClose, onCreated }: Props) {
  const userId = useDeviceId()
  const [selectedStation, setSelectedStation] = useState('')
  const [minutesBefore, setMinutesBefore] = useState(10)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleCreate = async () => {
    if (!selectedStation) {
      setError('Please select a station.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await createAlert({
        train_id: trainId,
        user_id: userId,
        station_id: selectedStation,
        minutes_before: minutesBefore,
      })
      setSuccess(true)
      setTimeout(() => {
        onCreated()
        onClose()
        setSuccess(false)
        setSelectedStation('')
      }, 1500)
    } catch {
      setError('Failed to create alert. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Set Alert</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 text-emerald-600">
            <Check className="w-10 h-10 mb-2" />
            <p className="font-semibold">Alert created!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Station select */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Notify me before</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary-light"
              >
                <option value="">Select a station...</option>
                {stops.map((stop) => (
                  <option key={`${stop.station_code}-${stop.sequence}`} value={stop.station_code}>
                    {stop.station_name} ({stop.station_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Minutes */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Minutes before arrival</label>
              <div className="flex gap-2">
                {[5, 10, 15, 30].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMinutesBefore(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      minutesBefore === m
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading || !selectedStation}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-800 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Set Alert'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
