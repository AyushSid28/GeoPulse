import { useQuery } from '@tanstack/react-query'
import { Sparkles, Loader2 } from 'lucide-react'
import { getLiveSummary } from '../../api/trains'

interface Props {
  trainId: string
}

export default function AISummaryCard({ trainId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trainSummary', trainId],
    queryFn: () => getLiveSummary(trainId),
    enabled: !!trainId,
    refetchInterval: 30_000,
  })

  return (
    <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-4 text-white shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4" />
        <h3 className="font-semibold text-sm">AI Status</h3>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-violet-200 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating summary...
        </div>
      )}

      {error && (
        <p className="text-violet-200 text-sm">Live summary unavailable.</p>
      )}

      {data?.summary && (
        <p className="text-sm leading-relaxed">{data.summary}</p>
      )}
    </div>
  )
}
