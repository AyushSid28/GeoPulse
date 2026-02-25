import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { getTrainDetail, getLiveStatus, getTrainRoute } from '../api/trains'
import TrainMap from '../components/train/TrainMap'
import StatusCards from '../components/train/StatusCards'
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

  const { data: routeData } = useQuery({
    queryKey: ['trainRoute', id],
    queryFn: () => getTrainRoute(id!),
    enabled: !!id,
  })

  const {
    data: liveStatus,
    isLoading: liveLoading,
    error: liveError,
    dataUpdatedAt,
    refetch: refetchLive,
  } = useQuery({
    queryKey: ['trainLive', id],
    queryFn: () => getLiveStatus(id!),
    enabled: !!id,
    refetchInterval: 30_000,
  })

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  const sourceLabel = liveStatus?.source === 'static_schedule' ? 'Schedule' : liveStatus?.source || null

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

      <div className="px-4 py-6 space-y-5">
        {isLoading && <LoadingSpinner label="Loading train details..." />}

        {error && (
          <ErrorBanner
            message="Failed to load train details."
            onRetry={() => refetch()}
          />
        )}

        {train && (
          <>
            {/* Map */}
            <TrainMap
              routeGeometry={routeData?.geometry || null}
              liveStatus={liveStatus || null}
            />

            {/* Live status section */}
            {liveLoading && <LoadingSpinner size="sm" label="Fetching live status..." />}

            {liveError && (
              <ErrorBanner
                message="Live status unavailable."
                onRetry={() => refetchLive()}
              />
            )}

            {liveStatus && liveStatus.source !== 'static_schedule' && (
              <StatusCards live={liveStatus} />
            )}

            {/* Updated info bar */}
            {lastUpdated && (
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <div className="flex items-center gap-1">
                  {sourceLabel && <span>via {sourceLabel}</span>}
                  {sourceLabel && lastUpdated && <span>·</span>}
                  {lastUpdated && <span>Updated {lastUpdated}</span>}
                </div>
                <button
                  onClick={() => refetchLive()}
                  className="flex items-center gap-1 text-primary-light hover:text-primary transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
            )}

            {/* Schedule */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Schedule</h2>
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <ScheduleTimeline
                  stops={train.schedule}
                  currentStationCode={liveStatus?.current_station?.station_code}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
