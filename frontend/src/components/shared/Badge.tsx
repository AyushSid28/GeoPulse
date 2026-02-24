interface Props {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'ai'
}

const variantClasses: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  ai: 'bg-violet-100 text-violet-700',
}

export default function Badge({ label, variant = 'default' }: Props) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${variantClasses[variant]}`}>
      {label}
    </span>
  )
}
