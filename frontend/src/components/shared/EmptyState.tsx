import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  subtitle?: string
}

export default function EmptyState({ icon: Icon, title, subtitle }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
      <Icon className="w-12 h-12 mb-3 opacity-40" />
      <p className="font-medium">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
    </div>
  )
}
