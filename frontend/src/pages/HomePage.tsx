import { Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div>
      <section className="bg-gradient-to-b from-primary to-blue-800 text-white px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">GeoPulse</h1>
        <p className="text-blue-200 mb-6">Track any Indian train, live.</p>
        <button
          onClick={() => navigate('/search')}
          className="w-full max-w-md mx-auto flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-left text-blue-100 hover:bg-white/20 transition"
        >
          <Search className="w-5 h-5" />
          Search by number or name
        </button>
      </section>

      <section className="px-4 py-6 max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6 text-white shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Ask AI</h2>
          </div>
          <p className="text-violet-100 text-sm mb-4">"Trains from Delhi to Mumbai tomorrow"</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your question..."
              className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/20 placeholder-violet-200 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button className="bg-white text-violet-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-violet-50 transition">
              Ask
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
