import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { listAlerts } from '../api/alerts'
import useDeviceId from '../hooks/useDeviceId'
import AlertCard from '../components/alerts/AlertCard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import EmptyState from '../components/shared/EmptyState'

export default function AlertsPage() {
  const userId = useDeviceId()

  const { data: alerts, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts', userId],
    queryFn: () => listAlerts(userId),
    refetchInterval: 30_000,
  })

  const active = alerts?.filter((a) => !a.triggered) || []
  const triggered = alerts?.filter((a) => a.triggered) || []

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Alerts</h1>

      {isLoading && <LoadingSpinner label="Loading alerts..." />}

      {error && (
        <ErrorBanner message="Failed to load alerts." onRetry={() => refetch()} />
      )}

      {alerts && alerts.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No alerts set yet"
          subtitle="Track a train and set alerts to get notified."
        />
      )}

      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-2">Active ({active.length})</h2>
          <div className="space-y-2">
            {active.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {triggered.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-2">Triggered</h2>
          <div className="space-y-2">
            {triggered.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
