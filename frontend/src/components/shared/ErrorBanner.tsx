import { AlertTriangle } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-red-600 hover:text-red-800 transition"
        >
          Retry
        </button>
      )}
    </div>
  )
}
