import { Bell } from 'lucide-react'

export default function AlertsPage() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Alerts</h1>
      <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
        <Bell className="w-12 h-12 mb-3 opacity-40" />
        <p>No alerts set yet.</p>
        <p className="text-sm mt-1">Track a train and set alerts to get notified.</p>
      </div>
    </div>
  )
}
