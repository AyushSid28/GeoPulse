interface Props {
  onSelect: (question: string) => void
}

const questions = [
  'When will I reach my destination?',
  'Why is the train delayed?',
  "What's the next stop?",
  'How long until the final station?',
]

export default function QuickQuestions({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-3 py-1.5 hover:bg-violet-100 transition"
        >
          {q}
        </button>
      ))}
    </div>
  )
}
