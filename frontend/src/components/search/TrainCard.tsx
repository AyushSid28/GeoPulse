import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Badge from '../shared/Badge'
import type { Train } from '../../types'

interface Props {
  train: Train
}

export default function TrainCard({ train }: Props) {
  const navigate = useNavigate()

  const handleClick = () => {
    const recent: Train[] = JSON.parse(localStorage.getItem('geopulse_recent') || '[]')
    const filtered = recent.filter((t) => t.id !== train.id)
    filtered.unshift(train)
    localStorage.setItem('geopulse_recent', JSON.stringify(filtered.slice(0, 10)))
    navigate(`/train/${train.number}`)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 shadow-sm hover:border-primary-light hover:shadow-md transition text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono font-medium text-primary">{train.number}</span>
          <Badge label={train.type || 'Train'} />
        </div>
        <p className="text-sm text-text-primary truncate">{train.name}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
    </button>
  )
}
