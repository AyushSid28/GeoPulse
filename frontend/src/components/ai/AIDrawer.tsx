import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Send, Loader2 } from 'lucide-react'
import { aiSearch } from '../../api/ai'
import { useNavigate } from 'react-router-dom'
import ChatBubble from './ChatBubble'
import type { Train } from '../../types'

interface Message {
  role: 'user' | 'ai'
  content: string
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function AIDrawer({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Train[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)
    setResults([])

    try {
      const data = await aiSearch(trimmed)
      setMessages((prev) => [...prev, { role: 'ai', content: data.caption }])
      setResults(data.results)
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleTrainClick = (train: Train) => {
    onClose()
    navigate(`/train/${train.number}`)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-ai" />
            <h3 className="font-semibold text-sm">GeoPulse AI</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-4">
              Ask me anything — "trains from Delhi to Mumbai", "fastest train to Bangalore"
            </p>
          )}

          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} content={msg.content} />
          ))}

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((train) => (
                <button
                  key={train.id}
                  onClick={() => handleTrainClick(train)}
                  className="w-full text-left bg-surface border border-border rounded-lg px-3 py-2 hover:border-primary-light transition"
                >
                  <span className="font-mono text-sm text-primary font-medium">{train.number}</span>
                  <span className="text-sm text-text-primary ml-2">{train.name}</span>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-violet-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border px-3 py-2 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about trains..."
            className="flex-1 text-sm bg-transparent focus:outline-none"
            disabled={loading}
            autoFocus
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
    </>
  )
}
