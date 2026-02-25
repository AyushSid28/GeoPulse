import type { StopTime } from '../../types'

interface Props {
  stops: StopTime[]
  currentStationCode?: string | null
}

export default function ScheduleTimeline({ stops, currentStationCode }: Props) {
  if (!stops.length) return null

  const formatTime = (t: string | null) => {
    if (!t) return '—'
    return t.length >= 5 ? t.slice(0, 5) : t
  }

  const currentIdx = currentStationCode
    ? stops.findIndex((s) => s.station_code === currentStationCode)
    : -1

  return (
    <div className="space-y-0">
      {stops.map((stop, idx) => {
        const isFirst = idx === 0
        const isLast = idx === stops.length - 1
        const isCurrent = idx === currentIdx
        const isDeparted = currentIdx >= 0 && idx < currentIdx
        const isUpcoming = currentIdx >= 0 && idx > currentIdx

        let dotClass = 'bg-white border-slate-400'
        let lineColor = 'bg-slate-300'

        if (isDeparted) {
          dotClass = 'bg-emerald-500 border-emerald-500'
          lineColor = 'bg-emerald-400'
        } else if (isCurrent) {
          dotClass = 'bg-primary-light border-primary-light ring-4 ring-blue-200'
        } else if (isFirst || isLast) {
          dotClass = currentIdx < 0 ? 'bg-primary border-primary' : (isDeparted ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-400')
        }

        if (isFirst && (isDeparted || isCurrent)) {
          dotClass = 'bg-emerald-500 border-emerald-500'
        }
        if (isLast && !isDeparted && !isCurrent && currentIdx >= 0) {
          dotClass = 'bg-white border-slate-400'
        }

        return (
          <div
            key={`${stop.station_code}-${stop.sequence}`}
            className={`flex gap-3 ${isCurrent ? 'bg-blue-50 -mx-2 px-2 rounded-lg' : ''}`}
          >
            {/* Timeline rail */}
            <div className="flex flex-col items-center w-5 shrink-0">
              {!isFirst && <div className={`w-0.5 flex-1 ${isDeparted || isCurrent ? 'bg-emerald-400' : lineColor}`} />}
              <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${dotClass}`} />
              {!isLast && <div className={`w-0.5 flex-1 ${isDeparted && !isCurrent ? 'bg-emerald-400' : lineColor}`} />}
            </div>

            {/* Stop info */}
            <div className={`flex-1 pb-4 ${isFirst ? 'pt-0' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isCurrent ? 'text-primary-light font-semibold' : isUpcoming ? 'text-text-secondary' : 'text-text-primary'}`}>
                    {stop.station_name}
                    {isCurrent && <span className="ml-2 text-xs text-primary-light font-normal">● Current</span>}
                  </p>
                  <span className="font-mono text-xs text-text-secondary">{stop.station_code}</span>
                </div>
                <div className="text-right text-xs">
                  {stop.arrival_time && (
                    <p className={isDeparted ? 'text-text-secondary line-through' : 'text-text-secondary'}>
                      Arr: <span className="font-mono font-medium text-text-primary">{formatTime(stop.arrival_time)}</span>
                    </p>
                  )}
                  {stop.departure_time && (
                    <p className={isDeparted ? 'text-text-secondary line-through' : 'text-text-secondary'}>
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
