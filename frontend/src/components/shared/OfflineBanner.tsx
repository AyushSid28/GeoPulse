import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
      <WifiOff className="w-4 h-4" />
      You're offline — some features may be unavailable
    </div>
  )
}
