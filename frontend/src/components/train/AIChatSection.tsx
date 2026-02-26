import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { aiAssistant } from '../../api/ai'
import ChatBubble from '../ai/ChatBubble'
import QuickQuestions from '../ai/QuickQuestions'

interface Message {
  role: 'user' | 'ai'
  content: string
}

interface Props {
  trainId: string
}

export default function AIChatSection({ trainId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const res = await aiAssistant(trainId, trimmed)
      setMessages((prev) => [...prev, { role: 'ai', content: res.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I could not process your question right now.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="border-2 border-violet-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-violet-50 px-4 py-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-ai" />
        <h3 className="font-semibold text-sm text-violet-800">Ask about this train</h3>
      </div>

      {/* Messages */}
      <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto min-h-[120px]">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary text-center">Ask anything about this train</p>
            <QuickQuestions onSelect={sendMessage} />
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-violet-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-violet-200 px-3 py-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this train..."
          className="flex-1 text-sm bg-transparent focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-ai text-white p-2 rounded-lg hover:bg-violet-600 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
