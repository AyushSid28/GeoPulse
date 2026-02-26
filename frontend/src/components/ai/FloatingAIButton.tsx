import { Sparkles } from 'lucide-react'

interface Props {
  onClick: () => void
}

export default function FloatingAIButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-12 h-12 bg-ai text-white rounded-full shadow-lg hover:bg-violet-600 transition flex items-center justify-center"
      aria-label="Open AI assistant"
    >
      <Sparkles className="w-5 h-5" />
    </button>
  )
}
