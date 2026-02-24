import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { getTrainDetail } from '../api/trains'
import ScheduleTimeline from '../components/train/ScheduleTimeline'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import Badge from '../components/shared/Badge'

export default function TrainTrackPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: train, isLoading, error, refetch } = useQuery({
    queryKey: ['train', id],
    queryFn: () => getTrainDetail(id!),
    enabled: !!id,
  })

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-2 transition">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {train ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-lg">{train.number}</span>
              <Badge label={train.type || 'Train'} variant="ai" />
            </div>
            <h1 className="text-xl font-bold">{train.name}</h1>
          </div>
        ) : (
          <h1 className="text-xl font-bold">Train Details</h1>
        )}
      </div>

      <div className="px-4 py-6 space-y-6">
        {isLoading && <LoadingSpinner label="Loading train details..." />}

        {error && (
          <ErrorBanner
            message="Failed to load train details. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {train && (
          <>
            {/* Quick info cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border border-border rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1 text-text-secondary">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">Stops</span>
                </div>
                <p className="text-lg font-bold text-text-primary">{train.schedule.length}</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1 text-text-secondary">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Departs</span>
                </div>
                <p className="text-lg font-bold font-mono text-text-primary">
                  {train.schedule.length > 0 && train.schedule[0].departure_time
                    ? train.schedule[0].departure_time.slice(0, 5)
                    : '—'}
                </p>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Schedule</h2>
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <ScheduleTimeline stops={train.schedule} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
