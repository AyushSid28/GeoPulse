import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, MapPin, Navigation, Sparkles, Bell } from 'lucide-react'
import { getTrainDetail, getLiveStatus, getTrainRoute, snapToRoute } from '../api/trains'
import useGeolocation from '../hooks/useGeolocation'
import TrainMap from '../components/train/TrainMap'
import StatusCards from '../components/train/StatusCards'
import AISummaryCard from '../components/train/AISummaryCard'
import AIChatSection from '../components/train/AIChatSection'
import AlertModal from '../components/train/AlertModal'
import ScheduleTimeline from '../components/train/ScheduleTimeline'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import Badge from '../components/shared/Badge'
import Toast from '../components/shared/Toast'
import type { SnapResult } from '../types'

export default function TrainTrackPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [onTrain, setOnTrain] = useState(false)
  const [snapped, setSnapped] = useState<SnapResult | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const geo = useGeolocation()

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

  const handleToggleOnTrain = () => {
    if (onTrain) {
      geo.stop()
      setOnTrain(false)
      setSnapped(null)
    } else {
      geo.start()
      setOnTrain(true)
    }
  }

  useEffect(() => {
    if (!onTrain || !geo.position || !id) return

    let cancelled = false
    snapToRoute(id, geo.position.lat, geo.position.lng)
      .then((result) => {
        if (!cancelled) setSnapped(result)
      })
      .catch(() => {
        if (!cancelled) setSnapped(null)
      })

    return () => { cancelled = true }
  }, [onTrain, geo.position?.lat, geo.position?.lng, id])

  const handleAlertCreated = useCallback(() => {
    setToast('Alert created! You will be notified.')
  }, [])

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  const sourceLabel = liveStatus?.source === 'static_schedule' ? 'Schedule' : liveStatus?.source || null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

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
              userPosition={onTrain && geo.position ? geo.position : null}
              snappedPosition={onTrain && snapped ? snapped : null}
            />

            {/* AI Summary */}
            <AISummaryCard trainId={id!} />

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleToggleOnTrain}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition ${
                  onTrain
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface border-2 border-primary text-primary hover:bg-blue-50'
                }`}
              >
                {onTrain ? (
                  <><Navigation className="w-4 h-4" /> Tracking your location</>
                ) : (
                  <><MapPin className="w-4 h-4" /> I'm on this train</>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAlertOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-surface border-2 border-border text-text-primary hover:border-primary-light transition"
                >
                  <Bell className="w-4 h-4" /> Set Alert
                </button>
                <a
                  href="#ai-chat"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-violet-50 border-2 border-ai text-ai hover:bg-violet-100 transition"
                >
                  <Sparkles className="w-4 h-4" /> Ask AI
                </a>
              </div>
            </div>

            {/* Geo error */}
            {onTrain && geo.error && <ErrorBanner message={geo.error} />}

            {/* Snap info */}
            {onTrain && snapped && snapped.distance_meters !== undefined && (
              <p className="text-xs text-text-secondary text-center">
                {snapped.distance_meters < 500
                  ? `You're on track (${Math.round(snapped.distance_meters)}m from route)`
                  : `You're ${Math.round(snapped.distance_meters)}m from the nearest track point`}
              </p>
            )}

            {/* Live status */}
            {liveLoading && <LoadingSpinner size="sm" label="Fetching live status..." />}

            {liveError && (
              <ErrorBanner message="Live status unavailable." onRetry={() => refetchLive()} />
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
                  <RefreshCw className="w-3 h-3" /> Refresh
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

            {/* AI Chat */}
            <div id="ai-chat">
              <AIChatSection trainId={id!} />
            </div>

            {/* Alert Modal */}
            <AlertModal
              trainId={id!}
              stops={train.schedule}
              open={alertOpen}
              onClose={() => setAlertOpen(false)}
              onCreated={handleAlertCreated}
            />
          </>
        )}
      </div>
    </div>
  )
}
