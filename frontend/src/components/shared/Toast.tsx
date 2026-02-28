import { useEffect } from 'react'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'

interface Props {
  message: string
  type?: 'success' | 'warning' | 'error'
  onClose: () => void
  duration?: number
}

const styles = {
  success: { bg: 'bg-emerald-600', icon: CheckCircle },
  warning: { bg: 'bg-amber-500', icon: AlertTriangle },
  error: { bg: 'bg-red-600', icon: AlertTriangle },
}

export default function Toast({ message, type = 'success', onClose, duration = 4000 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const { bg, icon: Icon } = styles[type]

  return (
    <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[60] ${bg} text-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 animate-slide-down`}>
      <Icon className="w-5 h-5 shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      <button onClick={onClose} className="p-0.5 hover:bg-white/20 rounded transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
