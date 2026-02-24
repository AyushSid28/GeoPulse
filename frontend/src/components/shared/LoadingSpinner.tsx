import { Loader2 } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }

export default function LoadingSpinner({ size = 'md', label }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <Loader2 className={`${sizeMap[size]} animate-spin text-primary-light`} />
      {label && <p className="text-sm text-text-secondary">{label}</p>}
    </div>
  )
}
