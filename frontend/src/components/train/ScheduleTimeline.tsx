import type { StopTime } from '../../types'

interface Props {
  stops: StopTime[]
}

export default function ScheduleTimeline({ stops }: Props) {
  if (!stops.length) return null

  const formatTime = (t: string | null) => {
    if (!t) return '—'
    return t.length >= 5 ? t.slice(0, 5) : t
  }

  return (
    <div className="space-y-0">
      {stops.map((stop, idx) => {
        const isFirst = idx === 0
        const isLast = idx === stops.length - 1

        return (
          <div key={`${stop.station_code}-${stop.sequence}`} className="flex gap-3">
            {/* Timeline rail */}
            <div className="flex flex-col items-center w-5 shrink-0">
              {!isFirst && <div className="w-0.5 flex-1 bg-slate-300" />}
              <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                isFirst || isLast
                  ? 'bg-primary border-primary'
                  : 'bg-white border-slate-400'
              }`} />
              {!isLast && <div className="w-0.5 flex-1 bg-slate-300" />}
            </div>

            {/* Stop info */}
            <div className={`flex-1 pb-4 ${isFirst ? 'pt-0' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{stop.station_name}</p>
                  <span className="font-mono text-xs text-text-secondary">{stop.station_code}</span>
                </div>
                <div className="text-right text-xs">
                  {stop.arrival_time && (
                    <p className="text-text-secondary">
                      Arr: <span className="font-mono font-medium text-text-primary">{formatTime(stop.arrival_time)}</span>
                    </p>
                  )}
                  {stop.departure_time && (
                    <p className="text-text-secondary">
                      Dep: <span className="font-mono font-medium text-text-primary">{formatTime(stop.departure_time)}</span>
                    </p>
                  )}
                </div>
              </div>
              {stop.platform && (
                <p className="text-xs text-text-secondary mt-0.5">Platform {stop.platform}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
