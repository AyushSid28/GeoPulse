import { Sparkles, User } from 'lucide-react'

interface Props {
  role: 'user' | 'ai'
  content: string
}

export default function ChatBubble({ role, content }: Props) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-2 max-w-[80%]">
          <div className="bg-primary text-white rounded-2xl rounded-br-md px-4 py-2 text-sm">
            {content}
          </div>
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-ai" />
        </div>
        <div className="bg-violet-50 text-violet-900 rounded-2xl rounded-bl-md px-4 py-2 text-sm">
          {content}
        </div>
      </div>
    </div>
  )
}
